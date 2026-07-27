import { getDatabaseConnection } from "@/db/client";
import type { AuthenticatedUser } from "@/lib/auth/service";
import {
  createLocationInputSchema,
  moveAssetInputSchema,
  type LocationKind,
} from "@/lib/validation/locations";

export type LocationSummary = {
  id: string;
  parentId: string | null;
  kind: LocationKind;
  code: string;
  name: string;
  path: string;
  depth: number;
  directAssetCount: number;
};

export type AssetMovement = {
  id: string;
  locationId: string | null;
  locationCode: string | null;
  locationName: string | null;
  locationPath: string | null;
  startedAt: string;
  endedAt: string | null;
  reason: string;
  actorType: string | null;
};

function assertCanManageInventory(user: AuthenticatedUser) {
  if (user.role === "viewer") {
    throw new Error("Viewer accounts cannot change locations or inventory.");
  }
}

export async function listLocations(): Promise<LocationSummary[]> {
  const { client } = getDatabaseConnection();

  return client<LocationSummary[]>`
    with recursive location_tree as (
      select
        locations.id,
        locations.parent_id,
        locations.kind,
        locations.code,
        locations.name,
        locations.name::text as path,
        0::integer as depth,
        array[locations.id] as visited
      from locations
      where locations.parent_id is null
        and locations.archived_at is null

      union all

      select
        child.id,
        child.parent_id,
        child.kind,
        child.code,
        child.name,
        (location_tree.path || ' / ' || child.name)::text,
        location_tree.depth + 1,
        location_tree.visited || child.id
      from locations child
      inner join location_tree
        on location_tree.id = child.parent_id
      where child.archived_at is null
        and not child.id = any(location_tree.visited)
    )
    select
      location_tree.id,
      location_tree.parent_id as "parentId",
      location_tree.kind,
      location_tree.code,
      location_tree.name,
      location_tree.path,
      location_tree.depth,
      count(asset_location_assignments.id)::integer as "directAssetCount"
    from location_tree
    left join asset_location_assignments
      on asset_location_assignments.location_id = location_tree.id
      and asset_location_assignments.ended_at is null
    group by
      location_tree.id,
      location_tree.parent_id,
      location_tree.kind,
      location_tree.code,
      location_tree.name,
      location_tree.path,
      location_tree.depth
    order by location_tree.path, location_tree.code
  `;
}

export async function createLocation(input: unknown, user: AuthenticatedUser) {
  assertCanManageInventory(user);
  const validated = createLocationInputSchema.parse(input);
  const { client } = getDatabaseConnection();

  return client.begin(async (transaction) => {
    if (validated.parentId) {
      const [parent] = await transaction<{ id: string }[]>`
        select id
        from locations
        where id = ${validated.parentId}
          and archived_at is null
      `;

      if (!parent) {
        throw new Error("Select an active parent location.");
      }
    }

    const [location] = await transaction<{ id: string }[]>`
      insert into locations (
        parent_id,
        kind,
        code,
        name,
        notes,
        created_by
      )
      values (
        ${validated.parentId ?? null},
        ${validated.kind},
        ${validated.code},
        ${validated.name},
        ${validated.notes ?? null},
        ${user.id}
      )
      returning id
    `;

    if (!location) {
      throw new Error("Location creation did not return an identifier.");
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
        'location.created',
        'location',
        ${location.id},
        ${JSON.stringify({
          parentId: validated.parentId ?? null,
          kind: validated.kind,
          code: validated.code,
          name: validated.name,
        })}::jsonb
      )
    `;

    return location;
  });
}

export async function moveAsset(
  assetId: string,
  input: unknown,
  user: AuthenticatedUser,
) {
  assertCanManageInventory(user);
  const validated = moveAssetInputSchema.parse(input);
  const { client } = getDatabaseConnection();

  return client.begin(async (transaction) => {
    const [asset] = await transaction<
      Array<{ id: string; assetIdentifier: string }>
    >`
      select id, asset_identifier as "assetIdentifier"
      from assets
      where id = ${assetId}
      for update
    `;

    if (!asset) {
      throw new Error("Asset was not found.");
    }

    if (validated.locationId) {
      const [location] = await transaction<{ id: string }[]>`
        select id
        from locations
        where id = ${validated.locationId}
          and archived_at is null
      `;

      if (!location) {
        throw new Error("Select an active destination location.");
      }
    }

    const [current] = await transaction<
      Array<{ id: string; locationId: string | null }>
    >`
      select
        id,
        location_id as "locationId"
      from asset_location_assignments
      where asset_id = ${assetId}
        and ended_at is null
      for update
    `;

    if ((current?.locationId ?? null) === validated.locationId) {
      throw new Error("The asset is already recorded at that location.");
    }

    const [movementTime] = await transaction<{ value: string }[]>`
      select now() as value
    `;
    if (!movementTime) {
      throw new Error("The movement timestamp could not be created.");
    }

    if (current) {
      await transaction`
        update asset_location_assignments
        set ended_at = ${movementTime.value}
        where id = ${current.id}
      `;
    }

    const [assignment] = await transaction<{ id: string }[]>`
      insert into asset_location_assignments (
        asset_id,
        location_id,
        started_at,
        reason,
        created_by
      )
      values (
        ${assetId},
        ${validated.locationId},
        ${movementTime.value},
        ${validated.reason},
        ${user.id}
      )
      returning id
    `;

    if (!assignment) {
      throw new Error("The new asset location was not recorded.");
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
        'asset.moved',
        'asset',
        ${assetId},
        ${JSON.stringify({
          assetIdentifier: asset.assetIdentifier,
          fromLocationId: current?.locationId ?? null,
          toLocationId: validated.locationId,
          reason: validated.reason,
          assignmentId: assignment.id,
        })}::jsonb
      )
    `;

    return assignment;
  });
}

export async function getAssetMovements(
  assetId: string,
): Promise<AssetMovement[]> {
  const { client } = getDatabaseConnection();

  return client<AssetMovement[]>`
    with recursive location_paths as (
      select
        locations.id,
        locations.parent_id,
        locations.name::text as path,
        array[locations.id] as visited
      from locations
      where locations.parent_id is null

      union all

      select
        child.id,
        child.parent_id,
        (location_paths.path || ' / ' || child.name)::text,
        location_paths.visited || child.id
      from locations child
      inner join location_paths on location_paths.id = child.parent_id
      where not child.id = any(location_paths.visited)
    )
    select
      asset_location_assignments.id,
      asset_location_assignments.location_id as "locationId",
      locations.code as "locationCode",
      locations.name as "locationName",
      location_paths.path as "locationPath",
      asset_location_assignments.started_at as "startedAt",
      asset_location_assignments.ended_at as "endedAt",
      asset_location_assignments.reason,
      users.role::text as "actorType"
    from asset_location_assignments
    left join locations
      on locations.id = asset_location_assignments.location_id
    left join location_paths
      on location_paths.id = asset_location_assignments.location_id
    left join users
      on users.id = asset_location_assignments.created_by
    where asset_location_assignments.asset_id = ${assetId}
    order by asset_location_assignments.started_at desc
  `;
}
