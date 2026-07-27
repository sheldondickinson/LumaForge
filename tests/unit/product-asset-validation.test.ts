import { describe, expect, it } from "vitest";
import { createAssetsInputSchema } from "@/lib/validation/assets";
import {
  buildProductSpecifications,
  createProductInputSchema,
} from "@/lib/validation/products";

describe("product validation", () => {
  it("preserves decimal electrical and spacing values as strings", () => {
    const product = createProductInputSchema.parse({
      assetClassId: "4a4ca0e7-c755-4484-9818-7e41176b007f",
      name: "12 V WS2811 bullet pixel string",
      voltageV: "12.000",
      pixelCount: "100",
      spacingMm: "100.5",
      protocol: "WS2811",
      connector: "xConnect",
      changeSummary: "Initial product definition",
    });

    expect(buildProductSpecifications(product)).toEqual({
      voltageV: "12.000",
      pixelCount: 100,
      spacingMm: "100.5",
      protocol: "WS2811",
      connector: "xConnect",
    });
  });

  it("rejects malformed decimal specifications", () => {
    const result = createProductInputSchema.safeParse({
      assetClassId: "4a4ca0e7-c755-4484-9818-7e41176b007f",
      name: "Pixel string",
      voltageV: "12.1234",
      changeSummary: "Initial product definition",
    });

    expect(result.success).toBe(false);
  });
});

describe("asset validation", () => {
  it("requires a reason for a physical specification override", () => {
    const result = createAssetsInputSchema.safeParse({
      assetClassId: "4a4ca0e7-c755-4484-9818-7e41176b007f",
      quantity: "1",
      status: "available",
      actualPixelCount: "96",
      overrideReason: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.overrideReason).toEqual([
        "Explain why the physical asset differs from the product.",
      ]);
    }
  });

  it("limits one allocation request to one hundred assets", () => {
    const result = createAssetsInputSchema.safeParse({
      assetClassId: "4a4ca0e7-c755-4484-9818-7e41176b007f",
      quantity: "101",
      status: "available",
    });

    expect(result.success).toBe(false);
  });
});
