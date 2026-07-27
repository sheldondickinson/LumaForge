import { getDatabaseConnection } from "@/db/client";
import type { AuthenticatedUser } from "@/lib/auth/service";
import {
  allocatePowerInputSchema,
  assignOutputInputSchema,
  createControllerInputSchema,
  createPsuInputSchema,
} from "@/lib/validation/controllers-power";

export type ControllerSummary = {
  id: string;
  controllerCode: string;
  assetId: string;
  assetIdentifier: string;
  friendlyName: string;
  definitionName: string;
  outputCount: number;
  powerBankCount: number;
  assignedCount: number;
};

export type ControllerDetail = ControllerSummary & {
  manufacturer: string | null;
  model: string | null;
  protocol: string | null;
  outputs: Array<{
    id: string;
    outputNumber: number;
    name: string;
    bankNumber: number;
    bankName: string;
    currentAssignmentId: string | null;
    displayElementName: string | null;
    positionName: string | null;
    logicalIdentifier: string | null;
  }>;
  assignmentHistory: Array<{
    id: string;
    outputNumber: number;
    displayElementName: string;
    positionName: string;
    logicalIdentifier: string;
    effectiveFrom: string;
    effectiveTo: string | null;
    reason: string;
  }>;
  banks: Array<{
    id: string;
    bankNumber: number;
    name: string;
    psuIdentifier: string | null;
    psuName: string | null;
  }>;
};

export type SpecialisationAssetOption = {
  id: string;
  assetIdentifier: string;
  friendlyName: string;
};

export type PositionOption = {
  id: string;
  elementName: string;
  positionName: string;
  positionCode: string;
};

export type PsuSummary = {
  id: string;
  assetId: string;
  assetIdentifier: string;
  friendlyName: string;
  definitionName: string;
  outputVoltageV: string;
  maximumCurrentA: string;
  maximumPowerW: string;
};

export type PowerBankOption = {
  id: string;
  controllerId: string;
  controllerCode: string;
  bankNumber: number;
  name: string;
  psuIdentifier: string | null;
  psuName: string | null;
};

function assertCanManage(user: AuthenticatedUser) {
  if (user.role === "viewer") {
    throw new Error("Viewer accounts cannot change controller or power data.");
  }
}

export function formatLogicalIdentifier(input: {
  controllerCode: string;
  outputNumber: number;
  propNumber: number;
  stringNumber: number;
}) {
  return `${input.controllerCode}-O${String(input.outputNumber).padStart(2, "0")}-P${String(input.propNumber).padStart(3, "0")}-S${String(input.stringNumber).padStart(2, "0")}`;
}

export async function listUnspecialisedAssets(
  identifierPrefix: "CTRL" | "PSU",
): Promise<SpecialisationAssetOption[]> {
  const { client } = getDatabaseConnection();
  return client<SpecialisationAssetOption[]>`
    select
      assets.id,
      assets.asset_identifier as "assetIdentifier",
      assets.friendly_name as "friendlyName"
    from assets
    inner join asset_classes on asset_classes.id = assets.asset_class_id
    left join controller_assets on controller_assets.asset_id = assets.id
    left join psu_assets on psu_assets.asset_id = assets.id
    where asset_classes.identifier_prefix = ${identifierPrefix}
      and assets.retired_at is null
      and (
        (${identifierPrefix} = 'CTRL' and controller_assets.id is null)
        or (${identifierPrefix} = 'PSU' and psu_assets.id is null)
      )
    order by assets.asset_identifier
  `;
}

export async function listPositionOptions(): Promise<PositionOption[]> {
  const { client } = getDatabaseConnection();
  return client<PositionOption[]>`
    select
      component_positions.id,
      display_elements.name as "elementName",
      component_positions.name as "positionName",
      component_positions.code as "positionCode"
    from component_positions
    inner join display_elements
      on display_elements.id = component_positions.display_element_id
    order by display_elements.name, component_positions.sequence
  `;
}

export async function createController(
  input: unknown,
  user: AuthenticatedUser,
) {
  assertCanManage(user);
  const validated = createControllerInputSchema.parse(input);
  if (validated.powerBankCount > validated.outputCount) {
    throw new Error("A controller cannot have more power banks than outputs.");
  }
  const { client } = getDatabaseConnection();
  return client.begin(async (transaction) => {
    const [asset] = await transaction<{ id: string }[]>`
      select assets.id
      from assets
      inner join asset_classes on asset_classes.id = assets.asset_class_id
      left join controller_assets on controller_assets.asset_id = assets.id
      where assets.id = ${validated.assetId}
        and asset_classes.identifier_prefix = 'CTRL'
        and assets.retired_at is null
        and controller_assets.id is null
      for update of assets
    `;
    if (!asset) throw new Error("Select an unused, active controller asset.");

    const [definition] = await transaction<{ id: string }[]>`
      insert into controller_definitions (
        name, manufacturer, model, protocol, output_count, power_bank_count,
        notes, created_by
      )
      values (
        ${validated.name}, ${validated.manufacturer ?? null},
        ${validated.model ?? null}, ${validated.protocol ?? null},
        ${validated.outputCount}, ${validated.powerBankCount},
        ${validated.notes ?? null}, ${user.id}
      )
      returning id
    `;
    if (!definition)
      throw new Error("The controller definition was not created.");

    const [controller] = await transaction<{ id: string }[]>`
      insert into controller_assets (
        asset_id, controller_definition_id, controller_code, created_by
      )
      values (
        ${validated.assetId}, ${definition.id}, ${validated.controllerCode},
        ${user.id}
      )
      returning id
    `;
    if (!controller)
      throw new Error("The controller asset was not specialised.");

    const banks: string[] = [];
    for (
      let bankNumber = 1;
      bankNumber <= validated.powerBankCount;
      bankNumber++
    ) {
      const [bank] = await transaction<{ id: string }[]>`
        insert into power_banks (controller_asset_id, bank_number, name)
        values (
          ${controller.id}, ${bankNumber}, ${`Power bank ${bankNumber}`}
        )
        returning id
      `;
      if (!bank) throw new Error("A controller power bank was not created.");
      banks.push(bank.id);
    }
    const outputsPerBank = Math.ceil(
      validated.outputCount / validated.powerBankCount,
    );
    for (
      let outputNumber = 1;
      outputNumber <= validated.outputCount;
      outputNumber++
    ) {
      const bankIndex = Math.min(
        validated.powerBankCount - 1,
        Math.floor((outputNumber - 1) / outputsPerBank),
      );
      await transaction`
        insert into controller_outputs (
          controller_asset_id, power_bank_id, output_number, name
        )
        values (
          ${controller.id}, ${banks[bankIndex]!}, ${outputNumber},
          ${`Output ${outputNumber}`}
        )
      `;
    }
    await transaction`
      insert into audit_events (
        actor_type, actor_id, action, entity_type, entity_id, details
      )
      values (
        ${user.role}, ${user.id}, 'controller.created', 'controller',
        ${controller.id},
        ${JSON.stringify({
          assetId: validated.assetId,
          controllerCode: validated.controllerCode,
          outputCount: validated.outputCount,
          powerBankCount: validated.powerBankCount,
        })}::jsonb
      )
    `;
    return controller;
  });
}

export async function listControllers(): Promise<ControllerSummary[]> {
  const { client } = getDatabaseConnection();
  return client<ControllerSummary[]>`
    select
      controller_assets.id,
      controller_assets.controller_code as "controllerCode",
      assets.id as "assetId",
      assets.asset_identifier as "assetIdentifier",
      assets.friendly_name as "friendlyName",
      controller_definitions.name as "definitionName",
      controller_definitions.output_count as "outputCount",
      controller_definitions.power_bank_count as "powerBankCount",
      count(output_assignments.id) filter (
        where output_assignments.effective_to is null
      )::int as "assignedCount"
    from controller_assets
    inner join assets on assets.id = controller_assets.asset_id
    inner join controller_definitions
      on controller_definitions.id = controller_assets.controller_definition_id
    left join controller_outputs
      on controller_outputs.controller_asset_id = controller_assets.id
    left join output_assignments
      on output_assignments.controller_output_id = controller_outputs.id
    group by controller_assets.id, assets.id, controller_definitions.id
    order by controller_assets.controller_code
  `;
}

export async function assignOutput(
  outputId: string,
  input: unknown,
  user: AuthenticatedUser,
) {
  assertCanManage(user);
  const validated = assignOutputInputSchema.parse(input);
  const { client } = getDatabaseConnection();
  return client.begin(async (transaction) => {
    await transaction`
      select pg_advisory_xact_lock(hashtext(${`output-position:${validated.componentPositionId}`}))
    `;
    const [context] = await transaction<
      Array<{
        outputId: string;
        outputNumber: number;
        controllerCode: string;
        displayElementId: string;
      }>
    >`
      select
        controller_outputs.id as "outputId",
        controller_outputs.output_number as "outputNumber",
        controller_assets.controller_code as "controllerCode",
        display_elements.id as "displayElementId"
      from controller_outputs
      inner join controller_assets
        on controller_assets.id = controller_outputs.controller_asset_id
      cross join component_positions
      inner join display_elements
        on display_elements.id = component_positions.display_element_id
      where controller_outputs.id = ${outputId}
        and component_positions.id = ${validated.componentPositionId}
    `;
    if (!context)
      throw new Error("Select a valid output and component position.");
    const [changedAt] = await transaction<{ value: string }[]>`
      select now() as value
    `;
    if (!changedAt) throw new Error("The assignment time was not created.");
    await transaction`
      update output_assignments
      set effective_to = ${changedAt.value}
      where component_position_id = ${validated.componentPositionId}
        and effective_to is null
    `;
    const [assignment] = await transaction<{ id: string }[]>`
      insert into output_assignments (
        controller_output_id, display_element_id, component_position_id,
        prop_number, string_number, effective_from, reason, created_by
      )
      values (
        ${outputId}, ${context.displayElementId},
        ${validated.componentPositionId}, ${validated.propNumber},
        ${validated.stringNumber}, ${changedAt.value}, ${validated.reason},
        ${user.id}
      )
      returning id
    `;
    if (!assignment) throw new Error("The output assignment was not created.");
    return {
      ...assignment,
      logicalIdentifier: formatLogicalIdentifier({
        controllerCode: context.controllerCode,
        outputNumber: context.outputNumber,
        propNumber: validated.propNumber,
        stringNumber: validated.stringNumber,
      }),
    };
  });
}

export async function getControllerDetail(
  controllerId: string,
): Promise<ControllerDetail | null> {
  const { client } = getDatabaseConnection();
  const [controller] = await client<
    Array<Omit<ControllerDetail, "outputs" | "assignmentHistory" | "banks">>
  >`
    select
      controller_assets.id,
      controller_assets.controller_code as "controllerCode",
      assets.id as "assetId",
      assets.asset_identifier as "assetIdentifier",
      assets.friendly_name as "friendlyName",
      controller_definitions.name as "definitionName",
      controller_definitions.manufacturer,
      controller_definitions.model,
      controller_definitions.protocol,
      controller_definitions.output_count as "outputCount",
      controller_definitions.power_bank_count as "powerBankCount",
      (
        select count(*)::int from output_assignments
        inner join controller_outputs assigned_output
          on assigned_output.id = output_assignments.controller_output_id
        where assigned_output.controller_asset_id = controller_assets.id
          and output_assignments.effective_to is null
      ) as "assignedCount"
    from controller_assets
    inner join assets on assets.id = controller_assets.asset_id
    inner join controller_definitions
      on controller_definitions.id = controller_assets.controller_definition_id
    where controller_assets.id = ${controllerId}
  `;
  if (!controller) return null;
  const outputsRaw = await client<
    Array<
      Omit<ControllerDetail["outputs"][number], "logicalIdentifier"> & {
        propNumber: number | null;
        stringNumber: number | null;
      }
    >
  >`
    select
      controller_outputs.id,
      controller_outputs.output_number as "outputNumber",
      controller_outputs.name,
      power_banks.bank_number as "bankNumber",
      power_banks.name as "bankName",
      output_assignments.id as "currentAssignmentId",
      display_elements.name as "displayElementName",
      component_positions.name as "positionName",
      output_assignments.prop_number as "propNumber",
      output_assignments.string_number as "stringNumber"
    from controller_outputs
    inner join power_banks on power_banks.id = controller_outputs.power_bank_id
    left join output_assignments
      on output_assignments.controller_output_id = controller_outputs.id
      and output_assignments.effective_to is null
    left join display_elements
      on display_elements.id = output_assignments.display_element_id
    left join component_positions
      on component_positions.id = output_assignments.component_position_id
    where controller_outputs.controller_asset_id = ${controllerId}
    order by controller_outputs.output_number
  `;
  const outputs = outputsRaw.map((output) => ({
    ...output,
    logicalIdentifier:
      output.propNumber && output.stringNumber
        ? formatLogicalIdentifier({
            controllerCode: controller.controllerCode,
            outputNumber: output.outputNumber,
            propNumber: output.propNumber,
            stringNumber: output.stringNumber,
          })
        : null,
  }));
  const historyRaw = await client<
    Array<
      Omit<
        ControllerDetail["assignmentHistory"][number],
        "logicalIdentifier"
      > & { propNumber: number; stringNumber: number }
    >
  >`
    select
      output_assignments.id,
      controller_outputs.output_number as "outputNumber",
      display_elements.name as "displayElementName",
      component_positions.name as "positionName",
      output_assignments.prop_number as "propNumber",
      output_assignments.string_number as "stringNumber",
      output_assignments.effective_from as "effectiveFrom",
      output_assignments.effective_to as "effectiveTo",
      output_assignments.reason
    from output_assignments
    inner join controller_outputs
      on controller_outputs.id = output_assignments.controller_output_id
    inner join display_elements
      on display_elements.id = output_assignments.display_element_id
    inner join component_positions
      on component_positions.id = output_assignments.component_position_id
    where controller_outputs.controller_asset_id = ${controllerId}
    order by output_assignments.effective_from desc
  `;
  const assignmentHistory = historyRaw.map((assignment) => ({
    ...assignment,
    logicalIdentifier: formatLogicalIdentifier({
      controllerCode: controller.controllerCode,
      outputNumber: assignment.outputNumber,
      propNumber: assignment.propNumber,
      stringNumber: assignment.stringNumber,
    }),
  }));
  const banks = await client<ControllerDetail["banks"]>`
    select
      power_banks.id,
      power_banks.bank_number as "bankNumber",
      power_banks.name,
      assets.asset_identifier as "psuIdentifier",
      assets.friendly_name as "psuName"
    from power_banks
    left join power_allocations
      on power_allocations.power_bank_id = power_banks.id
      and power_allocations.effective_to is null
    left join psu_assets on psu_assets.id = power_allocations.psu_asset_id
    left join assets on assets.id = psu_assets.asset_id
    where power_banks.controller_asset_id = ${controllerId}
    order by power_banks.bank_number
  `;
  return { ...controller, outputs, assignmentHistory, banks };
}

export async function createPsu(input: unknown, user: AuthenticatedUser) {
  assertCanManage(user);
  const validated = createPsuInputSchema.parse(input);
  const { client } = getDatabaseConnection();
  return client.begin(async (transaction) => {
    const [asset] = await transaction<{ id: string }[]>`
      select assets.id
      from assets
      inner join asset_classes on asset_classes.id = assets.asset_class_id
      left join psu_assets on psu_assets.asset_id = assets.id
      where assets.id = ${validated.assetId}
        and asset_classes.identifier_prefix = 'PSU'
        and assets.retired_at is null
        and psu_assets.id is null
      for update of assets
    `;
    if (!asset) throw new Error("Select an unused, active power supply asset.");
    const [definition] = await transaction<{ id: string }[]>`
      insert into psu_definitions (
        name, manufacturer, model, output_voltage_v, maximum_current_a,
        maximum_power_w, notes, created_by
      )
      values (
        ${validated.name}, ${validated.manufacturer ?? null},
        ${validated.model ?? null}, ${validated.outputVoltageV},
        ${validated.maximumCurrentA}, ${validated.maximumPowerW},
        ${validated.notes ?? null}, ${user.id}
      )
      returning id
    `;
    const [psu] = await transaction<{ id: string }[]>`
      insert into psu_assets (asset_id, psu_definition_id, created_by)
      values (${validated.assetId}, ${definition!.id}, ${user.id})
      returning id
    `;
    if (!psu) throw new Error("The PSU asset was not specialised.");
    return psu;
  });
}

export async function listPsus(): Promise<PsuSummary[]> {
  const { client } = getDatabaseConnection();
  return client<PsuSummary[]>`
    select
      psu_assets.id,
      assets.id as "assetId",
      assets.asset_identifier as "assetIdentifier",
      assets.friendly_name as "friendlyName",
      psu_definitions.name as "definitionName",
      psu_definitions.output_voltage_v as "outputVoltageV",
      psu_definitions.maximum_current_a as "maximumCurrentA",
      psu_definitions.maximum_power_w as "maximumPowerW"
    from psu_assets
    inner join assets on assets.id = psu_assets.asset_id
    inner join psu_definitions
      on psu_definitions.id = psu_assets.psu_definition_id
    order by assets.asset_identifier
  `;
}

export async function listPowerBanks(): Promise<PowerBankOption[]> {
  const { client } = getDatabaseConnection();
  return client<PowerBankOption[]>`
    select
      power_banks.id,
      controller_assets.id as "controllerId",
      controller_assets.controller_code as "controllerCode",
      power_banks.bank_number as "bankNumber",
      power_banks.name,
      assets.asset_identifier as "psuIdentifier",
      assets.friendly_name as "psuName"
    from power_banks
    inner join controller_assets
      on controller_assets.id = power_banks.controller_asset_id
    left join power_allocations
      on power_allocations.power_bank_id = power_banks.id
      and power_allocations.effective_to is null
    left join psu_assets on psu_assets.id = power_allocations.psu_asset_id
    left join assets on assets.id = psu_assets.asset_id
    order by controller_assets.controller_code, power_banks.bank_number
  `;
}

export async function allocatePower(
  bankId: string,
  input: unknown,
  user: AuthenticatedUser,
) {
  assertCanManage(user);
  const validated = allocatePowerInputSchema.parse(input);
  const { client } = getDatabaseConnection();
  return client.begin(async (transaction) => {
    await transaction`
      select pg_advisory_xact_lock(hashtext(${`power-bank:${bankId}`}))
    `;
    const [changedAt] = await transaction<{ value: string }[]>`
      select now() as value
    `;
    if (!changedAt) throw new Error("The allocation time was not created.");
    await transaction`
      update power_allocations
      set effective_to = ${changedAt.value}
      where power_bank_id = ${bankId} and effective_to is null
    `;
    const [allocation] = await transaction<{ id: string }[]>`
      insert into power_allocations (
        psu_asset_id, power_bank_id, effective_from, reason, created_by
      )
      values (
        ${validated.psuAssetId}, ${bankId}, ${changedAt.value},
        ${validated.reason}, ${user.id}
      )
      returning id
    `;
    if (!allocation) throw new Error("The power allocation was not created.");
    return allocation;
  });
}
