import { z } from "zod";

const optionalText = (maximumLength: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(maximumLength).optional(),
  );

const optionalDecimal = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d{1,3})?$/, "Enter a positive decimal value.")
    .optional(),
);

const optionalPositiveInteger = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.coerce.number().int().positive().max(1_000_000).optional(),
);

export const productRevisionInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  manufacturer: optionalText(120),
  model: optionalText(120),
  description: optionalText(2_000),
  voltageV: optionalDecimal,
  pixelCount: optionalPositiveInteger,
  currentPerPixelMa: optionalDecimal,
  spacingMm: optionalDecimal,
  protocol: optionalText(80),
  connector: optionalText(80),
  changeSummary: z.string().trim().min(2).max(500),
});

export const createProductInputSchema = productRevisionInputSchema.extend({
  assetClassId: z.string().uuid(),
});

export type ProductRevisionInput = z.infer<typeof productRevisionInputSchema>;

export function buildProductSpecifications(input: ProductRevisionInput) {
  return Object.fromEntries(
    Object.entries({
      voltageV: input.voltageV,
      pixelCount: input.pixelCount,
      currentPerPixelMa: input.currentPerPixelMa,
      spacingMm: input.spacingMm,
      protocol: input.protocol,
      connector: input.connector,
    }).filter((entry): entry is [string, string | number] =>
      Boolean(entry[1] !== undefined),
    ),
  );
}
