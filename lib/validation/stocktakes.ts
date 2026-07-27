import { z } from "zod";

const optionalText = (maximumLength: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(maximumLength).optional(),
  );

export const createStocktakeInputSchema = z.object({
  locationId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  notes: optionalText(2_000),
});

export const scanStocktakeAssetInputSchema = z.object({
  assetIdentifier: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z][A-Z0-9]{0,11}-[0-9]+$/,
      "Enter or scan a permanent asset ID.",
    ),
  notes: optionalText(500),
});
