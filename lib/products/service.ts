import { getDatabaseConnection } from "@/db/client";
import type { AuthenticatedUser } from "@/lib/auth/service";
import {
  buildProductSpecifications,
  createProductInputSchema,
  productRevisionInputSchema,
} from "@/lib/validation/products";

export type AssetClassOption = {
  id: string;
  name: string;
  identifierPrefix: string;
};

export type ProductSummary = {
  id: string;
  assetClassName: string;
  assetClassPrefix: string;
  revisionId: string;
  revisionNumber: number;
  name: string;
  manufacturer: string | null;
  model: string | null;
  createdAt: string;
};

export type ProductDetail = ProductSummary & {
  assetClassId: string;
  description: string | null;
  specifications: Record<string, string | number | boolean | null>;
  revisions: Array<{
    id: string;
    revisionNumber: number;
    name: string;
    manufacturer: string | null;
    model: string | null;
    description: string | null;
    specifications: Record<string, string | number | boolean | null>;
    changeSummary: string;
    createdAt: string;
  }>;
};

function assertCanManageProducts(user: AuthenticatedUser) {
  if (user.role === "viewer") {
    throw new Error("Viewer accounts cannot change product definitions.");
  }
}

export async function listAssetClasses(): Promise<AssetClassOption[]> {
  const { client } = getDatabaseConnection();
  return client<AssetClassOption[]>`
    select
      id,
      name,
      identifier_prefix as "identifierPrefix"
    from asset_classes
    where is_active = true
    order by name
  `;
}

export async function listProducts(query = ""): Promise<ProductSummary[]> {
  const { client } = getDatabaseConnection();
  const search = query.trim();

  return client<ProductSummary[]>`
    select
      product_definitions.id,
      asset_classes.name as "assetClassName",
      asset_classes.identifier_prefix as "assetClassPrefix",
      current_revision.id as "revisionId",
      current_revision.revision_number as "revisionNumber",
      current_revision.name,
      current_revision.manufacturer,
      current_revision.model,
      current_revision.created_at as "createdAt"
    from product_definitions
    inner join asset_classes
      on asset_classes.id = product_definitions.asset_class_id
    inner join lateral (
      select *
      from product_revisions
      where product_definition_id = product_definitions.id
      order by revision_number desc
      limit 1
    ) current_revision on true
    where product_definitions.archived_at is null
      and (
        ${search} = ''
        or current_revision.name ilike ${`%${search}%`}
        or coalesce(current_revision.manufacturer, '') ilike ${`%${search}%`}
        or coalesce(current_revision.model, '') ilike ${`%${search}%`}
        or asset_classes.name ilike ${`%${search}%`}
      )
    order by current_revision.name, product_definitions.id
    limit 200
  `;
}

export async function listCurrentProductRevisions() {
  const { client } = getDatabaseConnection();
  return client<
    Array<{
      productId: string;
      revisionId: string;
      assetClassId: string;
      assetClassPrefix: string;
      name: string;
      revisionNumber: number;
    }>
  >`
    select
      product_definitions.id as "productId",
      current_revision.id as "revisionId",
      product_definitions.asset_class_id as "assetClassId",
      asset_classes.identifier_prefix as "assetClassPrefix",
      current_revision.name,
      current_revision.revision_number as "revisionNumber"
    from product_definitions
    inner join asset_classes
      on asset_classes.id = product_definitions.asset_class_id
    inner join lateral (
      select id, name, revision_number
      from product_revisions
      where product_definition_id = product_definitions.id
      order by revision_number desc
      limit 1
    ) current_revision on true
    where product_definitions.archived_at is null
      and asset_classes.is_active = true
    order by current_revision.name
  `;
}

export async function getProductDetail(
  productId: string,
): Promise<ProductDetail | null> {
  const { client } = getDatabaseConnection();
  const [product] = await client<Omit<ProductDetail, "revisions">[]>`
    select
      product_definitions.id,
      product_definitions.asset_class_id as "assetClassId",
      asset_classes.name as "assetClassName",
      asset_classes.identifier_prefix as "assetClassPrefix",
      current_revision.id as "revisionId",
      current_revision.revision_number as "revisionNumber",
      current_revision.name,
      current_revision.manufacturer,
      current_revision.model,
      current_revision.description,
      current_revision.specifications,
      current_revision.created_at as "createdAt"
    from product_definitions
    inner join asset_classes
      on asset_classes.id = product_definitions.asset_class_id
    inner join lateral (
      select *
      from product_revisions
      where product_definition_id = product_definitions.id
      order by revision_number desc
      limit 1
    ) current_revision on true
    where product_definitions.id = ${productId}
      and product_definitions.archived_at is null
  `;

  if (!product) {
    return null;
  }

  const revisions = await client<ProductDetail["revisions"]>`
    select
      id,
      revision_number as "revisionNumber",
      name,
      manufacturer,
      model,
      description,
      specifications,
      change_summary as "changeSummary",
      created_at as "createdAt"
    from product_revisions
    where product_definition_id = ${productId}
    order by revision_number desc
  `;

  return { ...product, revisions };
}

export async function createProduct(input: unknown, user: AuthenticatedUser) {
  assertCanManageProducts(user);
  const validated = createProductInputSchema.parse(input);
  const specifications = buildProductSpecifications(validated);
  const { client } = getDatabaseConnection();

  return client.begin(async (transaction) => {
    const [assetClass] = await transaction<{ id: string }[]>`
      select id
      from asset_classes
      where id = ${validated.assetClassId}
        and is_active = true
    `;

    if (!assetClass) {
      throw new Error("Select an active asset class.");
    }

    const [product] = await transaction<{ id: string }[]>`
      insert into product_definitions (asset_class_id, created_by)
      values (${validated.assetClassId}, ${user.id})
      returning id
    `;

    if (!product) {
      throw new Error("Product creation did not return an identifier.");
    }

    const [revision] = await transaction<{ id: string }[]>`
      insert into product_revisions (
        product_definition_id,
        revision_number,
        name,
        manufacturer,
        model,
        description,
        specifications,
        change_summary,
        created_by
      )
      values (
        ${product.id},
        1,
        ${validated.name},
        ${validated.manufacturer ?? null},
        ${validated.model ?? null},
        ${validated.description ?? null},
        ${JSON.stringify(specifications)}::jsonb,
        ${validated.changeSummary},
        ${user.id}
      )
      returning id
    `;

    if (!revision) {
      throw new Error("Initial product revision was not created.");
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
        'product.created',
        'product_definition',
        ${product.id},
        ${JSON.stringify({
          revisionId: revision.id,
          revisionNumber: 1,
          name: validated.name,
        })}::jsonb
      )
    `;

    return product;
  });
}

export async function createProductRevision(
  productId: string,
  input: unknown,
  user: AuthenticatedUser,
) {
  assertCanManageProducts(user);
  const validated = productRevisionInputSchema.parse(input);
  const specifications = buildProductSpecifications(validated);
  const { client } = getDatabaseConnection();

  return client.begin(async (transaction) => {
    const [product] = await transaction<{ id: string }[]>`
      select id
      from product_definitions
      where id = ${productId}
        and archived_at is null
      for update
    `;

    if (!product) {
      throw new Error("Product definition was not found.");
    }

    const [nextRevision] = await transaction<{ revisionNumber: number }[]>`
      select coalesce(max(revision_number), 0)::integer + 1 as "revisionNumber"
      from product_revisions
      where product_definition_id = ${productId}
    `;

    if (!nextRevision) {
      throw new Error("The next product revision could not be allocated.");
    }

    const [revision] = await transaction<{ id: string }[]>`
      insert into product_revisions (
        product_definition_id,
        revision_number,
        name,
        manufacturer,
        model,
        description,
        specifications,
        change_summary,
        created_by
      )
      values (
        ${productId},
        ${nextRevision.revisionNumber},
        ${validated.name},
        ${validated.manufacturer ?? null},
        ${validated.model ?? null},
        ${validated.description ?? null},
        ${JSON.stringify(specifications)}::jsonb,
        ${validated.changeSummary},
        ${user.id}
      )
      returning id
    `;

    if (!revision) {
      throw new Error(
        "Product revision creation did not return an identifier.",
      );
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
        'product.revised',
        'product_definition',
        ${productId},
        ${JSON.stringify({
          revisionId: revision.id,
          revisionNumber: nextRevision.revisionNumber,
          name: validated.name,
          changeSummary: validated.changeSummary,
        })}::jsonb
      )
    `;

    return {
      id: revision.id,
      revisionNumber: nextRevision.revisionNumber,
    };
  });
}
