import { describe, expect, it } from "vitest";
import { formatLogicalIdentifier } from "@/lib/controllers-power/service";
import {
  createControllerInputSchema,
  createPsuInputSchema,
} from "@/lib/validation/controllers-power";

describe("controller and power rules", () => {
  it("generates logical identifiers from separate structured fields", () => {
    expect(
      formatLogicalIdentifier({
        controllerCode: "A",
        outputNumber: 3,
        propNumber: 22,
        stringNumber: 2,
      }),
    ).toBe("A-O03-P022-S02");
  });

  it("normalises controller codes without changing asset identity", () => {
    const result = createControllerInputSchema.parse({
      assetId: "7d54bc3e-1994-4cc0-8613-8d86b3be7637",
      name: "Test controller",
      controllerCode: "a",
      outputCount: "16",
      powerBankCount: "4",
    });
    expect(result.controllerCode).toBe("A");
    expect(result.outputCount).toBe(16);
  });

  it("accepts decimal-safe PSU ratings and rejects excess precision", () => {
    const base = {
      assetId: "7d54bc3e-1994-4cc0-8613-8d86b3be7637",
      name: "12 V PSU",
      outputVoltageV: "12",
      maximumCurrentA: "29.167",
      maximumPowerW: "350",
    };
    expect(createPsuInputSchema.parse(base).maximumCurrentA).toBe("29.167");
    expect(() =>
      createPsuInputSchema.parse({ ...base, maximumCurrentA: "29.1667" }),
    ).toThrow();
  });
});
