import { getDatabaseConnection } from "@/db/client";
import type { AuthenticatedUser } from "@/lib/auth/service";
import {
  createAssetsInputSchema,
  type AssetStatus,
} from "@/lib/validation/assets";

export type AssetSummary = {
  id: string;
  assetIdentifier: string;
  friendlyName: string;
  status: AssetStatus;
  assetClassName: string;
  productName: string | null;
  productRevisionNumber: number | null;
  createdAt: string;
};

export type AssetDetail = AssetSummary & {
  assetClassId: string;
  productRevisionId: string | null;
  specificationOverrides: Record<string, string | number | boolean | null>;
  overrideReason: string | null;
  notes: string | null;
  retiredAt: string | null;
  retirementReason: string | null;
  auditEvents: Array<{
    id: string;
    action: string;
    actorType: string;
    occurredAt: string;
    details: Record<string, unknown>;
  }>;
};

function assertCanManageAssets(user: AuthenticatedUser) {
  if (user.role === "viewer") {
    throw new Error("Viewer accounts cannot create or change assets.");
  }
}

export async function listAssets(query = ""): Promise<AssetSummary[]> {
  const { client } = getDatabaseConnection();
  const search = query.trim();

  return client<AssetSummary[]>`
    select
      assets.id,
      assets.asset_identifier as "assetIdentifier",
      assets.friendly_name as "friendlyName",
      assets.status,
      asset_classes.name as "assetClassName",
      product_revisions.name as "productName",
      product_revisions.revision_number as "productRevisionNumber",
      assets.created_at as "createdAt"
    from assets
    inner join asset_classes
      on asset_classes.id = assets.asset_class_id
    left join product_revisions
      on product_revisions.id = assets.product_revision_id
    where
      ${search} = ''
      or assets.asset_identifier ilike ${`%${search}%`}
      or assets.friendly_name ilike ${`%${search}%`}
      or asset_classes.name ilike ${`%${search}%`}
      or coalesce(product_revisions.name, '') ilike ${`%${search}%`}
    order by assets.created_at desc, assets.asset_identifier
    limit 250
  `;
}

export async function getAssetDetail(
  assetId: string,
): Promise<AssetDetail | null> {
  const { client } = getDatabaseConnection();
  const [asset] = await client<Omit<AssetDetail, "auditEvents">[]>`
    select
      assets.id,
      assets.asset_class_id as "assetClassId",
      assets.product_revision_id as "productRevisionId",
      assets.asset_identifier as "assetIdentifier",
      assets.friendly_name as "friendlyName",
      assets.status,
      assets.specification_overrides as "specificationOverrides",
      assets.override_reason as "overrideReason",
      assets.notes,
      assets.created_at as "createdAt",
      assets.retired_at as "retiredAt",
      assets.retirement_reason as "retirementReason",
      asset_classes.name as "assetClassName",
      product_revisions.name as "productName",
      product_revisions.revision_number as "productRevisionNumber"
    from assets
    inner join asset_classes
      on asset_classes.id = assets.asset_class_id
    left join product_revisions
      on product_revisions.id = assets.product_revision_id
    where assets.id = ${assetId}
  `;

  if (!asset) {
    return null;
  }

  const auditEvents = await client<AssetDetail["auditEvents"]>`
    select
      id,
      action,
      actor_type as "actorType",
      occurred_at as "occurredAt",
      details
    from audit_events
    where entity_type = 'asset'
      and entity_id = ${assetId}
    order by occurred_at desc
    limit 100
  `;

  return { ...asset, auditEvents };
}

export async function createAssets(input: unknown, user: AuthenticatedUser) {
  assertCanManageAssets(user);
  const validated = createAssetsInputSchema.parse(input);
  const { client } = getDatabaseConnection();

  return client.begin(async (transaction) => {
    const [assetClass] = await transaction<
      Array<{ id: string; identifierPrefix: string; identifierPadding: number }>
    >`
      select
        id,
        identifier_prefix as "identifierPrefix",
        identifier_padding as "identifierPadding"
      from asset_classes
      where id = ${validated.assetClassId}
        and is_active = true
    `;

    if (!assetClass) {
      throw new Error("Select an active asset class.");
    }

    if (validated.productRevisionId) {
      const [productRevision] = await transaction<{ id: string }[]>`
        select product_revisions.id
        from product_revisions
        inner join product_definitions
          on product_definitions.id = product_revisions.product_definition_id
        where product_revisions.id = ${validated.productRevisionId}
          and product_definitions.asset_class_id = ${validated.assetClassId}
          and product_definitions.archived_at is null
      `;

      if (!productRevision) {
        throw new Error(
          "The selected product revision does not match the asset class.",
        );
      }
    }

    const [allocation] = await transaction<{ firstValue: string }[]>`
      update asset_identifier_sequences
      set
        next_value = next_value + ${validated.quantity},
        updated_at = now()
      where asset_class_id = ${validated.assetClassId}
      returning (next_value - ${validated.quantity})::text as "firstValue"
    `;

    if (!allocation) {
      throw new Error("The asset identifier sequence is not configured.");
    }

    const firstValue = Number(allocation.firstValue);
    if (!Number.isSafeInteger(firstValue) || firstValue < 1) {
      throw new Error("The allocated asset identifier is outside safe limits.");
    }

    const specificationOverrides =
      validated.actualPixelCount === undefined
        ? {}
        : { pixelCount: validated.actualPixelCount };
    const created: Array<{ id: string; assetIdentifier: string }> = [];

    for (let offset = 0; offset < validated.quantity; offset += 1) {
      const sequenceValue = firstValue + offset;
      const assetIdentifier = `${assetClass.identifierPrefix}-${String(
        sequenceValue,
      ).padStart(assetClass.identifierPadding, "0")}`;
      const friendlyName = validated.friendlyNameBase
        ? validated.quantity === 1
          ? validated.friendlyNameBase
          : `${validated.friendlyNameBase} ${offset + 1}`
        : assetIdentifier;

      const [asset] = await transaction<
        Array<{ id: string; assetIdentifier: string }>
      >`
        insert into assets (
          asset_class_id,
          product_revision_id,
          asset_identifier,
          friendly_name,
          status,
          specification_overrides,
          override_reason,
          notes,
          created_by,
          updated_by
        )
        values (
          ${validated.assetClassId},
          ${validated.productRevisionId ?? null},
          ${assetIdentifier},
          ${friendlyName},
          ${validated.status},
          ${JSON.stringify(specificationOverrides)}::jsonb,
          ${validated.overrideReason ?? null},
          ${validated.notes ?? null},
          ${user.id},
          ${user.id}
        )
        returning
          id,
          asset_identifier as "assetIdentifier"
      `;

      if (!asset) {
        throw new Error("Asset creation did not return an identifier.");
      }

      await transaction`
        insert into audit_events (
          actor_type,
          actor_id,
          action,
          entity_type,
          entity_id,
          details
        )
        values (
          ${user.role},
          ${user.id},
          'asset.created',
          'asset',
          ${asset.id},
          ${JSON.stringify({
            assetIdentifier,
            friendlyName,
            status: validated.status,
            productRevisionId: validated.productRevisionId ?? null,
          })}::jsonb
        )
      `;

      created.push(asset);
    }

    return created;
  });
}
