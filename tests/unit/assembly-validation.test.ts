import { describe, expect, it } from "vitest";
import {
  assignComponentInputSchema,
  createDisplayElementInputSchema,
} from "@/lib/validation/assemblies";

describe("assembly validation", () => {
  it("turns one position per line into explicit unique positions", () => {
    const result = createDisplayElementInputSchema.parse({
      assetId: "d9bfc942-6f56-4ce4-b5e0-390ac1453a99",
      name: "Singing face",
      positions: "Outline\nEyes\nMouth A\nMouth B\nMouth C",
    });
    expect(result.positions).toEqual([
      "Outline",
      "Eyes",
      "Mouth A",
      "Mouth B",
      "Mouth C",
    ]);
  });

  it("rejects duplicate position names", () => {
    expect(() =>
      createDisplayElementInputSchema.parse({
        assetId: "d9bfc942-6f56-4ce4-b5e0-390ac1453a99",
        name: "Singing face",
        positions: "Eyes\neyes",
      }),
    ).toThrow(/unique/i);
  });

  it("requires a physical component asset", () => {
    expect(() =>
      assignComponentInputSchema.parse({ componentAssetId: "not-an-id" }),
    ).toThrow();
  });
});
