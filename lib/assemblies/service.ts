import { getDatabaseConnection } from "@/db/client";
import type { AuthenticatedUser } from "@/lib/auth/service";
import {
  assignComponentInputSchema,
  createDisplayElementInputSchema,
  createRelationshipInputSchema,
} from "@/lib/validation/assemblies";

export type AssetOption = {
  id: string;
  assetIdentifier: string;
  friendlyName: string;
  assetClassName: string;
};

export type DisplayElementSummary = {
  id: string;
  assetId: string;
  name: string;
  description: string | null;
  assetIdentifier: string;
  friendlyName: string;
  positionCount: number;
  assignedCount: number;
};

export type AssemblyRelationship = {
  id: string;
  relationshipType: string;
  sourceAssetId: string;
  sourceIdentifier: string;
  sourceName: string;
  targetAssetId: string;
  targetIdentifier: string;
  targetName: string;
  componentPositionId: string | null;
  positionCode: string | null;
  positionName: string | null;
  sourceConnector: string | null;
  targetConnector: string | null;
  configurationRevision: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  notes: string | null;
};

export type DisplayElementDetail = DisplayElementSummary & {
  positions: Array<{
    id: string;
    code: string;
    name: string;
    sequence: number;
    connector: string | null;
    currentAssetId: string | null;
    currentAssetIdentifier: string | null;
    currentAssetName: string | null;
  }>;
  history: AssemblyRelationship[];
};

function assertCanManageAssemblies(user: AuthenticatedUser) {
  if (user.role === "viewer") {
    throw new Error("Viewer accounts cannot change assemblies.");
  }
}

export async function listAssetOptions(): Promise<AssetOption[]> {
  const { client } = getDatabaseConnection();
  return client<AssetOption[]>`
    select
      assets.id,
      assets.asset_identifier as "assetIdentifier",
      assets.friendly_name as "friendlyName",
      asset_classes.name as "assetClassName"
    from assets
    inner join asset_classes on asset_classes.id = assets.asset_class_id
    where assets.retired_at is null
    order by assets.asset_identifier
  `;
}

export async function listAvailablePropAssets(): Promise<AssetOption[]> {
  const { client } = getDatabaseConnection();
  return client<AssetOption[]>`
    select
      assets.id,
      assets.asset_identifier as "assetIdentifier",
      assets.friendly_name as "friendlyName",
      asset_classes.name as "assetClassName"
    from assets
    inner join asset_classes on asset_classes.id = assets.asset_class_id
    left join display_elements on display_elements.asset_id = assets.id
    where asset_classes.name = 'Prop or display element'
      and assets.retired_at is null
      and display_elements.id is null
    order by assets.asset_identifier
  `;
}

export async function listDisplayElements(): Promise<DisplayElementSummary[]> {
  const { client } = getDatabaseConnection();
  return client<DisplayElementSummary[]>`
    select
      display_elements.id,
      display_elements.asset_id as "assetId",
      display_elements.name,
      display_elements.description,
      assets.asset_identifier as "assetIdentifier",
      assets.friendly_name as "friendlyName",
      count(distinct component_positions.id)::int as "positionCount",
      count(distinct current_relationship.id)::int as "assignedCount"
    from display_elements
    inner join assets on assets.id = display_elements.asset_id
    left join component_positions
      on component_positions.display_element_id = display_elements.id
    left join asset_relationships current_relationship
      on current_relationship.component_position_id = component_positions.id
      and current_relationship.effective_to is null
    group by display_elements.id, assets.id
    order by display_elements.created_at desc
  `;
}

export async function createDisplayElement(
  input: unknown,
  user: AuthenticatedUser,
) {
  assertCanManageAssemblies(user);
  const validated = createDisplayElementInputSchema.parse(input);
  const { client } = getDatabaseConnection();

  return client.begin(async (transaction) => {
    const [asset] = await transaction<
      { id: string; assetIdentifier: string }[]
    >`
      select assets.id, assets.asset_identifier as "assetIdentifier"
      from assets
      inner join asset_classes on asset_classes.id = assets.asset_class_id
      left join display_elements on display_elements.asset_id = assets.id
      where assets.id = ${validated.assetId}
        and asset_classes.name = 'Prop or display element'
        and assets.retired_at is null
        and display_elements.id is null
      for update of assets
    `;
    if (!asset) {
      throw new Error("Select an unused, active prop asset.");
    }

    const [element] = await transaction<{ id: string }[]>`
      insert into display_elements (asset_id, name, description, created_by)
      values (
        ${validated.assetId},
        ${validated.name},
        ${validated.description ?? null},
        ${user.id}
      )
      returning id
    `;
    if (!element) {
      throw new Error("The display element could not be created.");
    }

    for (const [index, positionName] of validated.positions.entries()) {
      await transaction`
        insert into component_positions (
          display_element_id,
          code,
          name,
          sequence
        )
        values (
          ${element.id},
          ${`P${String(index + 1).padStart(2, "0")}`},
          ${positionName},
          ${index + 1}
        )
      `;
    }

    await transaction`
      insert into audit_events (
        actor_type, actor_id, action, entity_type, entity_id, details
      )
      values (
        ${user.role},
        ${user.id},
        'display_element.created',
        'display_element',
        ${element.id},
        ${JSON.stringify({
          assetId: validated.assetId,
          assetIdentifier: asset.assetIdentifier,
          positionCount: validated.positions.length,
        })}::jsonb
      )
    `;
    return element;
  });
}

export async function getDisplayElementDetail(
  elementId: string,
): Promise<DisplayElementDetail | null> {
  const { client } = getDatabaseConnection();
  const [element] = await client<DisplayElementSummary[]>`
    select
      display_elements.id,
      display_elements.asset_id as "assetId",
      display_elements.name,
      display_elements.description,
      assets.asset_identifier as "assetIdentifier",
      assets.friendly_name as "friendlyName",
      count(distinct component_positions.id)::int as "positionCount",
      count(distinct current_relationship.id)::int as "assignedCount"
    from display_elements
    inner join assets on assets.id = display_elements.asset_id
    left join component_positions
      on component_positions.display_element_id = display_elements.id
    left join asset_relationships current_relationship
      on current_relationship.component_position_id = component_positions.id
      and current_relationship.effective_to is null
    where display_elements.id = ${elementId}
    group by display_elements.id, assets.id
  `;
  if (!element) return null;

  const positions = await client<DisplayElementDetail["positions"]>`
    select
      component_positions.id,
      component_positions.code,
      component_positions.name,
      component_positions.sequence,
      component_positions.connector,
      current_asset.id as "currentAssetId",
      current_asset.asset_identifier as "currentAssetIdentifier",
      current_asset.friendly_name as "currentAssetName"
    from component_positions
    left join asset_relationships current_relationship
      on current_relationship.component_position_id = component_positions.id
      and current_relationship.effective_to is null
    left join assets current_asset
      on current_asset.id = current_relationship.target_asset_id
    where component_positions.display_element_id = ${elementId}
    order by component_positions.sequence
  `;
  const history = await client<AssemblyRelationship[]>`
    select
      asset_relationships.id,
      asset_relationships.relationship_type as "relationshipType",
      source_asset.id as "sourceAssetId",
      source_asset.asset_identifier as "sourceIdentifier",
      source_asset.friendly_name as "sourceName",
      target_asset.id as "targetAssetId",
      target_asset.asset_identifier as "targetIdentifier",
      target_asset.friendly_name as "targetName",
      asset_relationships.component_position_id as "componentPositionId",
      component_positions.code as "positionCode",
      component_positions.name as "positionName",
      asset_relationships.source_connector as "sourceConnector",
      asset_relationships.target_connector as "targetConnector",
      asset_relationships.configuration_revision as "configurationRevision",
      asset_relationships.effective_from as "effectiveFrom",
      asset_relationships.effective_to as "effectiveTo",
      asset_relationships.notes
    from asset_relationships
    inner join assets source_asset
      on source_asset.id = asset_relationships.source_asset_id
    inner join assets target_asset
      on target_asset.id = asset_relationships.target_asset_id
    left join component_positions
      on component_positions.id = asset_relationships.component_position_id
    where component_positions.display_element_id = ${elementId}
    order by asset_relationships.effective_from desc
  `;
  return { ...element, positions, history };
}

export async function assignComponent(
  positionId: string,
  input: unknown,
  user: AuthenticatedUser,
) {
  assertCanManageAssemblies(user);
  const validated = assignComponentInputSchema.parse(input);
  const { client } = getDatabaseConnection();

  return client.begin(async (transaction) => {
    await transaction`
      select pg_advisory_xact_lock(hashtext(${`component-position:${positionId}`}))
    `;
    const [position] = await transaction<
      Array<{
        id: string;
        elementId: string;
        sourceAssetId: string;
        code: string;
      }>
    >`
      select
        component_positions.id,
        display_elements.id as "elementId",
        display_elements.asset_id as "sourceAssetId",
        component_positions.code
      from component_positions
      inner join display_elements
        on display_elements.id = component_positions.display_element_id
      where component_positions.id = ${positionId}
    `;
    if (!position) throw new Error("The component position was not found.");
    if (position.sourceAssetId === validated.componentAssetId) {
      throw new Error("A prop cannot be assigned as its own component.");
    }
    const [component] = await transaction<{ id: string }[]>`
      select id from assets
      where id = ${validated.componentAssetId} and retired_at is null
    `;
    if (!component) throw new Error("Select an active component asset.");

    const [changedAt] = await transaction<{ value: string }[]>`
      select now() as value
    `;
    if (!changedAt) throw new Error("The assignment time was not created.");

    const [current] = await transaction<
      { id: string; targetAssetId: string }[]
    >`
      select id, target_asset_id as "targetAssetId"
      from asset_relationships
      where component_position_id = ${positionId}
        and effective_to is null
      for update
    `;
    if (current?.targetAssetId === validated.componentAssetId) {
      throw new Error("That component is already assigned to this position.");
    }
    if (current) {
      await transaction`
        update asset_relationships
        set effective_to = ${changedAt.value}
        where id = ${current.id}
      `;
    }

    const [relationship] = await transaction<{ id: string }[]>`
      insert into asset_relationships (
        relationship_type,
        source_asset_id,
        target_asset_id,
        component_position_id,
        sequence,
        configuration_revision,
        effective_from,
        notes,
        created_by
      )
      select
        'component_of',
        ${position.sourceAssetId},
        ${validated.componentAssetId},
        component_positions.id,
        component_positions.sequence,
        coalesce(max(asset_relationships.configuration_revision), 0) + 1,
        ${changedAt.value},
        ${validated.notes ?? null},
        ${user.id}
      from component_positions
      left join asset_relationships
        on asset_relationships.component_position_id = component_positions.id
      where component_positions.id = ${positionId}
      group by component_positions.id
      returning id
    `;
    if (!relationship) throw new Error("The component was not assigned.");

    await transaction`
      insert into audit_events (
        actor_type, actor_id, action, entity_type, entity_id, details
      )
      values (
        ${user.role},
        ${user.id},
        'assembly.component_assigned',
        'display_element',
        ${position.elementId},
        ${JSON.stringify({
          positionId,
          positionCode: position.code,
          componentAssetId: validated.componentAssetId,
          replacedRelationshipId: current?.id ?? null,
        })}::jsonb
      )
    `;
    return relationship;
  });
}

export async function createAssetRelationship(
  sourceAssetId: string,
  input: unknown,
  user: AuthenticatedUser,
) {
  assertCanManageAssemblies(user);
  const validated = createRelationshipInputSchema.parse(input);
  if (validated.relationshipType === "component_of") {
    throw new Error("Component relationships must use a defined position.");
  }
  const { client } = getDatabaseConnection();
  const [relationship] = await client<{ id: string }[]>`
    insert into asset_relationships (
      relationship_type,
      source_asset_id,
      target_asset_id,
      source_connector,
      target_connector,
      notes,
      created_by
    )
    values (
      ${validated.relationshipType},
      ${sourceAssetId},
      ${validated.targetAssetId},
      ${validated.sourceConnector ?? null},
      ${validated.targetConnector ?? null},
      ${validated.notes ?? null},
      ${user.id}
    )
    returning id
  `;
  if (!relationship) throw new Error("The relationship was not created.");
  return relationship;
}

export async function getAssetRelationships(
  assetId: string,
): Promise<AssemblyRelationship[]> {
  const { client } = getDatabaseConnection();
  return client<AssemblyRelationship[]>`
    select
      asset_relationships.id,
      asset_relationships.relationship_type as "relationshipType",
      source_asset.id as "sourceAssetId",
      source_asset.asset_identifier as "sourceIdentifier",
      source_asset.friendly_name as "sourceName",
      target_asset.id as "targetAssetId",
      target_asset.asset_identifier as "targetIdentifier",
      target_asset.friendly_name as "targetName",
      asset_relationships.component_position_id as "componentPositionId",
      component_positions.code as "positionCode",
      component_positions.name as "positionName",
      asset_relationships.source_connector as "sourceConnector",
      asset_relationships.target_connector as "targetConnector",
      asset_relationships.configuration_revision as "configurationRevision",
      asset_relationships.effective_from as "effectiveFrom",
      asset_relationships.effective_to as "effectiveTo",
      asset_relationships.notes
    from asset_relationships
    inner join assets source_asset
      on source_asset.id = asset_relationships.source_asset_id
    inner join assets target_asset
      on target_asset.id = asset_relationships.target_asset_id
    left join component_positions
      on component_positions.id = asset_relationships.component_position_id
    where asset_relationships.source_asset_id = ${assetId}
       or asset_relationships.target_asset_id = ${assetId}
    order by asset_relationships.effective_from desc
  `;
}
