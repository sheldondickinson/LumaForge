import { z } from "zod";

export const assetStatuses = [
  "available",
  "in_use",
  "maintenance",
  "retired",
  "lost",
  "disposed",
] as const;

export const assetStatusSchema = z.enum(assetStatuses);
export type AssetStatus = z.infer<typeof assetStatusSchema>;

export const creatableAssetStatuses = [
  "available",
  "in_use",
  "maintenance",
] as const;

const optionalText = (maximumLength: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(maximumLength).optional(),
  );

const optionalPositiveInteger = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.coerce.number().int().positive().max(1_000_000).optional(),
);

export const createAssetsInputSchema = z
  .object({
    assetClassId: z.string().uuid(),
    productRevisionId: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim() === "" ? undefined : value,
      z.string().uuid().optional(),
    ),
    quantity: z.coerce.number().int().min(1).max(100),
    friendlyNameBase: optionalText(140),
    status: z.enum(creatableAssetStatuses).default("available"),
    actualPixelCount: optionalPositiveInteger,
    overrideReason: optionalText(500),
    notes: optionalText(2_000),
  })
  .superRefine((input, context) => {
    if (input.actualPixelCount !== undefined && !input.overrideReason) {
      context.addIssue({
        code: "custom",
        path: ["overrideReason"],
        message: "Explain why the physical asset differs from the product.",
      });
    }
  });

export type CreateAssetsInput = z.infer<typeof createAssetsInputSchema>;
