export type ValidationSeverity =
  "information" | "recommendation" | "warning" | "critical" | "blocking";

export type AssignmentFact = {
  outputId: string;
  outputNumber: number;
  bankId: string;
  bankNumber: number;
  assetIdentifier: string | null;
  voltageV: string | null;
  protocol: string | null;
  nodeCount: number | null;
  currentPerPixelMa: string | null;
};

export type PsuFact = {
  bankId: string;
  assetIdentifier: string | null;
  voltageV: string | null;
  maximumCurrentA: string | null;
  maximumPowerW: string | null;
};

export type CompatiblePsuFact = {
  psuAssetId: string;
  assetIdentifier: string;
  voltageV: string;
  maximumCurrentA: string;
  maximumPowerW: string;
};

export type ValidationFactSet = {
  controllerId: string;
  controllerCode: string;
  supportedProtocols: string[];
  maximumNodesPerOutput: number | null;
  maximumCurrentPerOutputA: string | null;
  assignments: AssignmentFact[];
  psus: PsuFact[];
  compatiblePsus: CompatiblePsuFact[];
};

export type ValidationResultDraft = {
  ruleCode: string;
  severity: ValidationSeverity;
  scopeType: "controller" | "output" | "power_bank";
  scopeId: string;
  message: string;
  evidence: Record<string, unknown>;
  overrideAllowed: boolean;
};

function scaled(value: string, precision = 3) {
  const [whole, fraction = ""] = value.split(".");
  return (
    BigInt(whole || "0") * 10n ** BigInt(precision) +
    BigInt(fraction.padEnd(precision, "0").slice(0, precision))
  );
}

function formatScaled(value: bigint, precision = 3) {
  const divisor = 10n ** BigInt(precision);
  const whole = value / divisor;
  const fraction = (value % divisor)
    .toString()
    .padStart(precision, "0")
    .replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function equalDecimal(left: string, right: string) {
  return scaled(left) === scaled(right);
}

function normaliseDecimal(value: string) {
  return formatScaled(scaled(value));
}

export function evaluateValidationRules(
  facts: ValidationFactSet,
): ValidationResultDraft[] {
  const results: ValidationResultDraft[] = [];
  const protocols = new Set(
    facts.supportedProtocols.map((protocol) => protocol.trim().toUpperCase()),
  );

  for (const assignment of facts.assignments) {
    if (!assignment.assetIdentifier) continue;
    if (
      !assignment.voltageV ||
      !assignment.nodeCount ||
      !assignment.currentPerPixelMa
    ) {
      results.push({
        ruleCode: "COMPONENT_ELECTRICAL_DATA_INCOMPLETE",
        severity: "information",
        scopeType: "output",
        scopeId: assignment.outputId,
        message: `${assignment.assetIdentifier} is missing voltage, node-count or current-per-pixel data; affected electrical rules were not evaluated.`,
        evidence: {
          voltageV: assignment.voltageV,
          nodeCount: assignment.nodeCount,
          currentPerPixelMa: assignment.currentPerPixelMa,
        },
        overrideAllowed: false,
      });
    }
    if (
      assignment.protocol &&
      protocols.size &&
      !protocols.has(assignment.protocol.toUpperCase())
    ) {
      results.push({
        ruleCode: "PROTOCOL_UNSUPPORTED",
        severity: "blocking",
        scopeType: "output",
        scopeId: assignment.outputId,
        message: `${assignment.assetIdentifier} uses ${assignment.protocol}, which controller ${facts.controllerCode} does not support.`,
        evidence: {
          protocol: assignment.protocol,
          supportedProtocols: [...protocols],
        },
        overrideAllowed: true,
      });
    }
    if (
      assignment.nodeCount &&
      facts.maximumNodesPerOutput &&
      assignment.nodeCount > facts.maximumNodesPerOutput
    ) {
      results.push({
        ruleCode: "OUTPUT_NODE_CAPACITY",
        severity: "critical",
        scopeType: "output",
        scopeId: assignment.outputId,
        message: `Output ${assignment.outputNumber} has ${assignment.nodeCount} nodes, exceeding its ${facts.maximumNodesPerOutput}-node limit.`,
        evidence: {
          nodeCount: assignment.nodeCount,
          maximumNodes: facts.maximumNodesPerOutput,
        },
        overrideAllowed: true,
      });
    }
    if (
      assignment.nodeCount &&
      assignment.currentPerPixelMa &&
      facts.maximumCurrentPerOutputA
    ) {
      const currentMaScaled =
        BigInt(assignment.nodeCount) * scaled(assignment.currentPerPixelMa);
      const maximumMaScaled = scaled(facts.maximumCurrentPerOutputA) * 1000n;
      if (currentMaScaled > maximumMaScaled) {
        results.push({
          ruleCode: "OUTPUT_CURRENT_CAPACITY",
          severity: "critical",
          scopeType: "output",
          scopeId: assignment.outputId,
          message: `Output ${assignment.outputNumber} requires ${formatScaled(currentMaScaled / 1000n)} A, exceeding its ${facts.maximumCurrentPerOutputA} A limit.`,
          evidence: {
            requiredCurrentA: formatScaled(currentMaScaled / 1000n),
            maximumCurrentA: facts.maximumCurrentPerOutputA,
          },
          overrideAllowed: true,
        });
      }
    }
  }

  const bankIds = new Set(facts.assignments.map((item) => item.bankId));
  for (const bankId of bankIds) {
    const assignments = facts.assignments.filter(
      (item) => item.bankId === bankId && item.assetIdentifier,
    );
    if (!assignments.length) continue;
    const bankNumber = assignments[0]?.bankNumber ?? 0;
    const voltages = [
      ...new Set(
        assignments
          .map((item) => item.voltageV)
          .filter((value): value is string => Boolean(value))
          .map(normaliseDecimal),
      ),
    ];
    if (voltages.length > 1) {
      results.push({
        ruleCode: "MIXED_BANK_VOLTAGE",
        severity: "blocking",
        scopeType: "power_bank",
        scopeId: bankId,
        message: `Power bank ${bankNumber} mixes ${voltages.join(" V and ")} V components.`,
        evidence: { voltages },
        overrideAllowed: true,
      });
    }
    const psu = facts.psus.find((item) => item.bankId === bankId);
    if (!psu?.assetIdentifier) {
      results.push({
        ruleCode: "POWER_BANK_UNSUPPLIED",
        severity: "warning",
        scopeType: "power_bank",
        scopeId: bankId,
        message: `Power bank ${bankNumber} has assigned outputs but no PSU allocation.`,
        evidence: { bankNumber },
        overrideAllowed: true,
      });
      continue;
    }
    if (
      voltages.length === 1 &&
      psu.voltageV &&
      !equalDecimal(voltages[0]!, psu.voltageV)
    ) {
      results.push({
        ruleCode: "PSU_VOLTAGE_MISMATCH",
        severity: "blocking",
        scopeType: "power_bank",
        scopeId: bankId,
        message: `${psu.assetIdentifier} supplies ${psu.voltageV} V but bank ${bankNumber} requires ${voltages[0]} V.`,
        evidence: {
          requiredVoltageV: voltages[0],
          suppliedVoltageV: psu.voltageV,
        },
        overrideAllowed: true,
      });
    }
    let totalMaScaled = 0n;
    for (const assignment of assignments) {
      if (assignment.nodeCount && assignment.currentPerPixelMa) {
        totalMaScaled +=
          BigInt(assignment.nodeCount) * scaled(assignment.currentPerPixelMa);
      }
    }
    if (totalMaScaled && psu.maximumCurrentA) {
      const maximumMaScaled = scaled(psu.maximumCurrentA) * 1000n;
      const voltageScaled = scaled(voltages[0] ?? psu.voltageV ?? "0");
      const requiredPowerScaled = (totalMaScaled * voltageScaled) / 1000n;
      const powerLimitScaled = psu.maximumPowerW
        ? scaled(psu.maximumPowerW) * 1000n
        : 0n;
      if (
        totalMaScaled > maximumMaScaled ||
        (powerLimitScaled && requiredPowerScaled > powerLimitScaled)
      ) {
        const compatible = facts.compatiblePsus
          .filter(
            (candidate) =>
              equalDecimal(
                candidate.voltageV,
                voltages[0] ?? psu.voltageV ?? "0",
              ) &&
              scaled(candidate.maximumCurrentA) * 1000n >= totalMaScaled &&
              scaled(candidate.maximumPowerW) * 1000n >= requiredPowerScaled,
          )
          .map((candidate) => candidate.assetIdentifier);
        results.push({
          ruleCode: "PSU_CAPACITY",
          severity: "critical",
          scopeType: "power_bank",
          scopeId: bankId,
          message: `${psu.assetIdentifier} is overloaded on bank ${bankNumber}.`,
          evidence: {
            requiredCurrentA: formatScaled(totalMaScaled / 1000n),
            maximumCurrentA: psu.maximumCurrentA,
            compatibleReplacementPsus: compatible,
          },
          overrideAllowed: true,
        });
      }
    }
  }

  if (!facts.maximumNodesPerOutput || !facts.maximumCurrentPerOutputA) {
    results.push({
      ruleCode: "CONTROLLER_CAPACITY_INCOMPLETE",
      severity: "information",
      scopeType: "controller",
      scopeId: facts.controllerId,
      message:
        "Controller output node or current capacity is incomplete; affected capacity rules were not evaluated.",
      evidence: {
        maximumNodesPerOutput: facts.maximumNodesPerOutput,
        maximumCurrentPerOutputA: facts.maximumCurrentPerOutputA,
      },
      overrideAllowed: false,
    });
  }
  if (!results.length) {
    results.push({
      ruleCode: "CONFIGURATION_VALID",
      severity: "information",
      scopeType: "controller",
      scopeId: facts.controllerId,
      message: "No validation issues were found.",
      evidence: {},
      overrideAllowed: false,
    });
  }
  return results;
}
