import { getDatabaseConnection } from "@/db/client";
import type { AuthenticatedUser } from "@/lib/auth/service";
import {
  createStocktakeInputSchema,
  scanStocktakeAssetInputSchema,
} from "@/lib/validation/stocktakes";

export type StocktakeStatus =
  "draft" | "in_progress" | "completed" | "cancelled";

export type StocktakeSummary = {
  id: string;
  name: string;
  status: StocktakeStatus;
  locationCode: string;
  locationName: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  scannedCount: number;
  missingCount: number;
};

export type StocktakeDetail = StocktakeSummary & {
  notes: string | null;
  entries: Array<{
    id: string;
    assetIdentifier: string;
    friendlyName: string;
    outcome: "confirmed" | "moved" | "unexpected" | "missing";
    expectedLocationCode: string | null;
    observedLocationCode: string | null;
    scannedAt: string | null;
    notes: string | null;
  }>;
};

function assertCanManageStocktakes(user: AuthenticatedUser) {
  if (user.role === "viewer") {
    throw new Error("Viewer accounts cannot manage stocktakes.");
  }
}

export async function listStocktakes(): Promise<StocktakeSummary[]> {
  const { client } = getDatabaseConnection();

  return client<StocktakeSummary[]>`
    select
      stocktakes.id,
      stocktakes.name,
      stocktakes.status,
      locations.code as "locationCode",
      locations.name as "locationName",
      stocktakes.created_at as "createdAt",
      stocktakes.started_at as "startedAt",
      stocktakes.completed_at as "completedAt",
      count(stocktake_entries.id) filter (
        where stocktake_entries.scanned_at is not null
      )::integer as "scannedCount",
      count(stocktake_entries.id) filter (
        where stocktake_entries.outcome = 'missing'
      )::integer as "missingCount"
    from stocktakes
    inner join locations on locations.id = stocktakes.location_id
    left join stocktake_entries
      on stocktake_entries.stocktake_id = stocktakes.id
    group by stocktakes.id, locations.id
    order by stocktakes.created_at desc
  `;
}

export async function getStocktakeDetail(
  stocktakeId: string,
): Promise<StocktakeDetail | null> {
  const { client } = getDatabaseConnection();
  const [stocktake] = await client<Omit<StocktakeDetail, "entries">[]>`
    select
      stocktakes.id,
      stocktakes.name,
      stocktakes.status,
      stocktakes.notes,
      locations.code as "locationCode",
      locations.name as "locationName",
      stocktakes.created_at as "createdAt",
      stocktakes.started_at as "startedAt",
      stocktakes.completed_at as "completedAt",
      count(stocktake_entries.id) filter (
        where stocktake_entries.scanned_at is not null
      )::integer as "scannedCount",
      count(stocktake_entries.id) filter (
        where stocktake_entries.outcome = 'missing'
      )::integer as "missingCount"
    from stocktakes
    inner join locations on locations.id = stocktakes.location_id
    left join stocktake_entries
      on stocktake_entries.stocktake_id = stocktakes.id
    where stocktakes.id = ${stocktakeId}
    group by stocktakes.id, locations.id
  `;

  if (!stocktake) {
    return null;
  }

  const entries = await client<StocktakeDetail["entries"]>`
    select
      stocktake_entries.id,
      assets.asset_identifier as "assetIdentifier",
      assets.friendly_name as "friendlyName",
      stocktake_entries.outcome,
      expected.code as "expectedLocationCode",
      observed.code as "observedLocationCode",
      stocktake_entries.scanned_at as "scannedAt",
      stocktake_entries.notes
    from stocktake_entries
    inner join assets on assets.id = stocktake_entries.asset_id
    left join locations expected
      on expected.id = stocktake_entries.expected_location_id
    left join locations observed
      on observed.id = stocktake_entries.observed_location_id
    where stocktake_entries.stocktake_id = ${stocktakeId}
    order by
      case stocktake_entries.outcome
        when 'missing' then 1
        when 'moved' then 2
        when 'unexpected' then 3
        else 4
      end,
      assets.asset_identifier
  `;

  return { ...stocktake, entries };
}

export async function createStocktake(input: unknown, user: AuthenticatedUser) {
  assertCanManageStocktakes(user);
  const validated = createStocktakeInputSchema.parse(input);
  const { client } = getDatabaseConnection();

  return client.begin(async (transaction) => {
    const [location] = await transaction<{ id: string }[]>`
      select id
      from locations
      where id = ${validated.locationId}
        and archived_at is null
    `;
    if (!location) {
      throw new Error("Select an active stocktake location.");
    }

    const [stocktake] = await transaction<{ id: string }[]>`
      insert into stocktakes (
        location_id,
        name,
        status,
        notes,
        started_at,
        created_by
      )
      values (
        ${validated.locationId},
        ${validated.name},
        'in_progress',
        ${validated.notes ?? null},
        now(),
        ${user.id}
      )
      returning id
    `;
    if (!stocktake) {
      throw new Error("Stocktake creation did not return an identifier.");
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
        'stocktake.started',
        'stocktake',
        ${stocktake.id},
        ${JSON.stringify({
          locationId: validated.locationId,
          name: validated.name,
        })}::jsonb
      )
    `;

    return stocktake;
  });
}

export async function scanStocktakeAsset(
  stocktakeId: string,
  input: unknown,
  user: AuthenticatedUser,
) {
  assertCanManageStocktakes(user);
  const validated = scanStocktakeAssetInputSchema.parse(input);
  const { client } = getDatabaseConnection();

  return client.begin(async (transaction) => {
    const [stocktake] = await transaction<
      Array<{ id: string; locationId: string }>
    >`
      select id, location_id as "locationId"
      from stocktakes
      where id = ${stocktakeId}
      for update
    `;
    if (!stocktake) {
      throw new Error("Stocktake was not found.");
    }

    const [active] = await transaction<{ active: boolean }[]>`
      select exists (
        select 1
        from stocktakes
        where id = ${stocktakeId}
          and status = 'in_progress'
      ) as active
    `;
    if (!active?.active) {
      throw new Error("Only an in-progress stocktake can accept scans.");
    }

    const [asset] = await transaction<
      Array<{ id: string; assetIdentifier: string }>
    >`
      select id, asset_identifier as "assetIdentifier"
      from assets
      where asset_identifier = ${validated.assetIdentifier}
    `;
    if (!asset) {
      throw new Error("No asset has that permanent identifier.");
    }

    const [current] = await transaction<
      Array<{ locationId: string | null; withinScope: boolean }>
    >`
      with recursive scope as (
        select id
        from locations
        where id = ${stocktake.locationId}

        union all

        select locations.id
        from locations
        inner join scope on scope.id = locations.parent_id
      )
      select
        assignment.location_id as "locationId",
        coalesce(assignment.location_id in (select id from scope), false)
          as "withinScope"
      from (select 1) seed
      left join lateral (
        select location_id
        from asset_location_assignments
        where asset_id = ${asset.id}
          and ended_at is null
        limit 1
      ) assignment on true
    `;

    const outcome = current?.withinScope
      ? "confirmed"
      : current?.locationId
        ? "moved"
        : "unexpected";

    const [entry] = await transaction<{ id: string }[]>`
      insert into stocktake_entries (
        stocktake_id,
        asset_id,
        expected_location_id,
        observed_location_id,
        outcome,
        scanned_at,
        scanned_by,
        notes
      )
      values (
        ${stocktakeId},
        ${asset.id},
        ${current?.locationId ?? null},
        ${stocktake.locationId},
        ${outcome},
        now(),
        ${user.id},
        ${validated.notes ?? null}
      )
      on conflict (stocktake_id, asset_id) do nothing
      returning id
    `;
    if (!entry) {
      throw new Error("That asset has already been scanned in this stocktake.");
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
        'stocktake.asset_scanned',
        'stocktake',
        ${stocktakeId},
        ${JSON.stringify({
          entryId: entry.id,
          assetId: asset.id,
          assetIdentifier: asset.assetIdentifier,
          expectedLocationId: current?.locationId ?? null,
          observedLocationId: stocktake.locationId,
          outcome,
        })}::jsonb
      )
    `;

    return entry;
  });
}

export async function completeStocktake(
  stocktakeId: string,
  user: AuthenticatedUser,
) {
  assertCanManageStocktakes(user);
  const { client } = getDatabaseConnection();

  return client.begin(async (transaction) => {
    const [stocktake] = await transaction<
      Array<{ id: string; locationId: string }>
    >`
      select id, location_id as "locationId"
      from stocktakes
      where id = ${stocktakeId}
        and status = 'in_progress'
      for update
    `;
    if (!stocktake) {
      throw new Error("Only an in-progress stocktake can be completed.");
    }

    const missing = await transaction<{ id: string }[]>`
      with recursive scope as (
        select id
        from locations
        where id = ${stocktake.locationId}

        union all

        select locations.id
        from locations
        inner join scope on scope.id = locations.parent_id
      )
      insert into stocktake_entries (
        stocktake_id,
        asset_id,
        expected_location_id,
        observed_location_id,
        outcome
      )
      select
        ${stocktakeId},
        assignments.asset_id,
        assignments.location_id,
        null,
        'missing'
      from asset_location_assignments assignments
      where assignments.ended_at is null
        and assignments.location_id in (select id from scope)
        and not exists (
          select 1
          from stocktake_entries
          where stocktake_entries.stocktake_id = ${stocktakeId}
            and stocktake_entries.asset_id = assignments.asset_id
        )
      returning id
    `;

    await transaction`
      update stocktakes
      set
        status = 'completed',
        completed_at = now(),
        completed_by = ${user.id}
      where id = ${stocktakeId}
    `;

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
        'stocktake.completed',
        'stocktake',
        ${stocktakeId},
        ${JSON.stringify({ missingCount: missing.length })}::jsonb
      )
    `;

    return { missingCount: missing.length };
  });
}
