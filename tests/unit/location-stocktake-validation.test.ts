import { describe, expect, it } from "vitest";
import {
  createLocationInputSchema,
  moveAssetInputSchema,
} from "@/lib/validation/locations";
import {
  createStocktakeInputSchema,
  scanStocktakeAssetInputSchema,
} from "@/lib/validation/stocktakes";

describe("location and stocktake validation", () => {
  it("normalises permanent location codes", () => {
    const result = createLocationInputSchema.parse({
      kind: "shed",
      code: "shed-01",
      name: "Display storage shed",
    });
    expect(result.code).toBe("SHED-01");
  });

  it("rejects unsafe location codes", () => {
    expect(() =>
      createLocationInputSchema.parse({
        kind: "rack",
        code: "Rack one!",
        name: "Rack one",
      }),
    ).toThrow();
  });

  it("requires a movement reason and supports becoming unlocated", () => {
    expect(
      moveAssetInputSchema.parse({
        locationId: "__unlocated__",
        reason: "Removed from storage for installation",
      }),
    ).toEqual({
      locationId: null,
      reason: "Removed from storage for installation",
    });

    expect(() =>
      moveAssetInputSchema.parse({ locationId: "", reason: "" }),
    ).toThrow();
  });

  it("validates stocktake scope and permanent asset identifiers", () => {
    const locationId = "4c159a47-c19d-4781-8913-ac6704911da0";
    expect(
      createStocktakeInputSchema.parse({
        locationId,
        name: "Post-season shed count",
      }).locationId,
    ).toBe(locationId);
    expect(
      scanStocktakeAssetInputSchema.parse({
        assetIdentifier: " px-000184 ",
      }).assetIdentifier,
    ).toBe("PX-000184");
  });
});
