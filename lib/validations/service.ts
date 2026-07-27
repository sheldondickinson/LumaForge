import { getDatabaseConnection } from "@/db/client";
import type { AuthenticatedUser } from "@/lib/auth/service";
import {
  evaluateValidationRules,
  type AssignmentFact,
  type CompatiblePsuFact,
  type PsuFact,
  type ValidationFactSet,
  type ValidationSeverity,
} from "@/lib/validation/engine";
import { z } from "zod";

const overrideSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Explain why the override is acceptable.")
    .max(1000),
});

function assertCanManage(user: AuthenticatedUser) {
  if (user.role === "viewer")
    throw new Error("Viewer accounts cannot run or override validation.");
}

export async function runControllerValidation(
  controllerId: string,
  user: AuthenticatedUser,
) {
  assertCanManage(user);
  const { client } = getDatabaseConnection();
  return client.begin(async (transaction) => {
    const [controller] = await transaction<
      Array<{
        id: string;
        controllerCode: string;
        protocol: string | null;
        maximumNodesPerOutput: number | null;
        maximumCurrentPerOutputA: string | null;
      }>
    >`
      select controller_assets.id,
        controller_assets.controller_code as "controllerCode",
        controller_definitions.protocol,
        controller_definitions.maximum_nodes_per_output as "maximumNodesPerOutput",
        controller_definitions.maximum_current_per_output_a as "maximumCurrentPerOutputA"
      from controller_assets
      inner join controller_definitions
        on controller_definitions.id = controller_assets.controller_definition_id
      where controller_assets.id = ${controllerId}
    `;
    if (!controller) throw new Error("The controller was not found.");
    const assignments = await transaction<AssignmentFact[]>`
      select
        controller_outputs.id as "outputId",
        controller_outputs.output_number as "outputNumber",
        power_banks.id as "bankId",
        power_banks.bank_number as "bankNumber",
        component_asset.asset_identifier as "assetIdentifier",
        product_revisions.specifications ->> 'voltageV' as "voltageV",
        product_revisions.specifications ->> 'protocol' as protocol,
        coalesce(
          (component_asset.specification_overrides ->> 'actualPixelCount')::int,
          (product_revisions.specifications ->> 'pixelCount')::int
        ) as "nodeCount",
        product_revisions.specifications ->> 'currentPerPixelMa' as "currentPerPixelMa"
      from controller_outputs
      inner join power_banks on power_banks.id = controller_outputs.power_bank_id
      left join output_assignments
        on output_assignments.controller_output_id = controller_outputs.id
        and output_assignments.effective_to is null
      left join asset_relationships
        on asset_relationships.component_position_id = output_assignments.component_position_id
        and asset_relationships.effective_to is null
      left join assets component_asset
        on component_asset.id = asset_relationships.target_asset_id
      left join product_revisions
        on product_revisions.id = component_asset.product_revision_id
      where controller_outputs.controller_asset_id = ${controllerId}
    `;
    const psus = await transaction<PsuFact[]>`
      select power_banks.id as "bankId",
        assets.asset_identifier as "assetIdentifier",
        psu_definitions.output_voltage_v as "voltageV",
        psu_definitions.maximum_current_a as "maximumCurrentA",
        psu_definitions.maximum_power_w as "maximumPowerW"
      from power_banks
      left join power_allocations
        on power_allocations.power_bank_id = power_banks.id
        and power_allocations.effective_to is null
      left join psu_assets on psu_assets.id = power_allocations.psu_asset_id
      left join assets on assets.id = psu_assets.asset_id
      left join psu_definitions on psu_definitions.id = psu_assets.psu_definition_id
      where power_banks.controller_asset_id = ${controllerId}
    `;
    const compatiblePsus = await transaction<CompatiblePsuFact[]>`
      select psu_assets.id as "psuAssetId", assets.asset_identifier as "assetIdentifier",
        psu_definitions.output_voltage_v as "voltageV",
        psu_definitions.maximum_current_a as "maximumCurrentA",
        psu_definitions.maximum_power_w as "maximumPowerW"
      from psu_assets
      inner join assets on assets.id = psu_assets.asset_id
      inner join psu_definitions on psu_definitions.id = psu_assets.psu_definition_id
      where assets.retired_at is null
    `;
    const facts: ValidationFactSet = {
      controllerId,
      controllerCode: controller.controllerCode,
      supportedProtocols: (controller.protocol ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      maximumNodesPerOutput: controller.maximumNodesPerOutput,
      maximumCurrentPerOutputA: controller.maximumCurrentPerOutputA,
      assignments,
      psus,
      compatiblePsus,
    };
    const results = evaluateValidationRules(facts);
    const [run] = await transaction<{ id: string }[]>`
      insert into validation_runs (controller_asset_id, created_by)
      values (${controllerId}, ${user.id}) returning id
    `;
    for (const result of results) {
      await transaction`
        insert into validation_results (
          validation_run_id, rule_code, severity, scope_type, scope_id,
          message, evidence, override_allowed
        )
        values (
          ${run!.id}, ${result.ruleCode}, ${result.severity},
          ${result.scopeType}, ${result.scopeId}, ${result.message},
          ${JSON.stringify(result.evidence)}::jsonb, ${result.overrideAllowed}
        )
      `;
    }
    return run!;
  });
}

export type ValidationRunDetail = {
  id: string;
  createdAt: string;
  controllerCode: string;
  results: Array<{
    id: string;
    ruleCode: string;
    severity: ValidationSeverity;
    message: string;
    evidence: Record<string, unknown>;
    overrideAllowed: boolean;
    overrideReason: string | null;
    overrideCreatedAt: string | null;
  }>;
};

export async function getLatestValidationRun(
  controllerId: string,
): Promise<ValidationRunDetail | null> {
  const { client } = getDatabaseConnection();
  const [run] = await client<Omit<ValidationRunDetail, "results">[]>`
    select validation_runs.id, validation_runs.created_at as "createdAt",
      controller_assets.controller_code as "controllerCode"
    from validation_runs
    inner join controller_assets
      on controller_assets.id = validation_runs.controller_asset_id
    where validation_runs.controller_asset_id = ${controllerId}
    order by validation_runs.created_at desc limit 1
  `;
  if (!run) return null;
  const results = await client<ValidationRunDetail["results"]>`
    select validation_results.id, validation_results.rule_code as "ruleCode",
      validation_results.severity, validation_results.message,
      validation_results.evidence,
      validation_results.override_allowed as "overrideAllowed",
      validation_overrides.reason as "overrideReason",
      validation_overrides.created_at as "overrideCreatedAt"
    from validation_results
    left join validation_overrides
      on validation_overrides.validation_result_id = validation_results.id
    where validation_results.validation_run_id = ${run.id}
    order by case validation_results.severity
      when 'blocking' then 1 when 'critical' then 2 when 'warning' then 3
      when 'recommendation' then 4 else 5 end,
      validation_results.rule_code
  `;
  return { ...run, results };
}

export async function overrideValidationResult(
  resultId: string,
  input: unknown,
  user: AuthenticatedUser,
) {
  assertCanManage(user);
  const validated = overrideSchema.parse(input);
  const { client } = getDatabaseConnection();
  const [override] = await client<{ id: string }[]>`
    insert into validation_overrides (validation_result_id, reason, created_by)
    select validation_results.id, ${validated.reason}, ${user.id}
    from validation_results
    where validation_results.id = ${resultId}
      and validation_results.override_allowed = true
    returning id
  `;
  if (!override)
    throw new Error("This validation result cannot be overridden.");
  return override;
}
