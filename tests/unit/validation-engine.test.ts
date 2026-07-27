import { describe, expect, it } from "vitest";
import {
  evaluateValidationRules,
  type ValidationFactSet,
} from "@/lib/validation/engine";

const baseFacts: ValidationFactSet = {
  controllerId: "11111111-1111-4111-8111-111111111111",
  controllerCode: "A",
  supportedProtocols: ["WS2811"],
  maximumNodesPerOutput: 100,
  maximumCurrentPerOutputA: "5.000",
  assignments: [
    {
      outputId: "22222222-2222-4222-8222-222222222222",
      outputNumber: 3,
      bankId: "33333333-3333-4333-8333-333333333333",
      bankNumber: 1,
      assetIdentifier: "PX-000001",
      voltageV: "12.000",
      protocol: "WS2811",
      nodeCount: 100,
      currentPerPixelMa: "60.000",
    },
  ],
  psus: [
    {
      bankId: "33333333-3333-4333-8333-333333333333",
      assetIdentifier: "PSU-000001",
      voltageV: "12.000",
      maximumCurrentA: "5.000",
      maximumPowerW: "60.000",
    },
  ],
  compatiblePsus: [
    {
      psuAssetId: "44444444-4444-4444-8444-444444444444",
      assetIdentifier: "PSU-000002",
      voltageV: "12.000",
      maximumCurrentA: "10.000",
      maximumPowerW: "120.000",
    },
  ],
};

describe("configuration validation engine", () => {
  it("flags protocol, node, output-current and PSU capacity failures", () => {
    const results = evaluateValidationRules({
      ...baseFacts,
      supportedProtocols: ["WS2812B"],
      maximumNodesPerOutput: 50,
    });
    expect(results.map((result) => result.ruleCode)).toEqual(
      expect.arrayContaining([
        "PROTOCOL_UNSUPPORTED",
        "OUTPUT_NODE_CAPACITY",
        "OUTPUT_CURRENT_CAPACITY",
        "PSU_CAPACITY",
      ]),
    );
    expect(
      results.find((result) => result.ruleCode === "PSU_CAPACITY")?.evidence,
    ).toMatchObject({ compatibleReplacementPsus: ["PSU-000002"] });
  });

  it("flags mixed component voltage", () => {
    const results = evaluateValidationRules({
      ...baseFacts,
      assignments: [
        ...baseFacts.assignments,
        {
          ...baseFacts.assignments[0]!,
          outputId: "55555555-5555-4555-8555-555555555555",
          outputNumber: 4,
          assetIdentifier: "PX-000002",
          voltageV: "5.000",
        },
      ],
    });
    expect(results.map((result) => result.ruleCode)).toContain(
      "MIXED_BANK_VOLTAGE",
    );
  });

  it("records missing capacity as information rather than a silent pass", () => {
    const results = evaluateValidationRules({
      ...baseFacts,
      maximumNodesPerOutput: null,
      maximumCurrentPerOutputA: null,
    });
    expect(results).toContainEqual(
      expect.objectContaining({
        ruleCode: "CONTROLLER_CAPACITY_INCOMPLETE",
        severity: "information",
        overrideAllowed: false,
      }),
    );
  });

  it("records missing component electrical data as information", () => {
    const results = evaluateValidationRules({
      ...baseFacts,
      assignments: [
        {
          ...baseFacts.assignments[0]!,
          currentPerPixelMa: null,
        },
      ],
    });
    expect(results).toContainEqual(
      expect.objectContaining({
        ruleCode: "COMPONENT_ELECTRICAL_DATA_INCOMPLETE",
        severity: "information",
        overrideAllowed: false,
      }),
    );
  });
});
