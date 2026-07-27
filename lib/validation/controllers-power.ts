import { z } from "zod";

const optionalText = (maximum: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(maximum).optional(),
  );

const positiveDecimal = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,3})?$/, `${label} must be a positive number.`)
    .refine(
      (value) => Number(value) > 0,
      `${label} must be greater than zero.`,
    );

export const createControllerInputSchema = z.object({
  assetId: z.string().uuid("Select a controller asset."),
  name: z
    .string()
    .trim()
    .min(1, "Enter a controller definition name.")
    .max(160),
  manufacturer: optionalText(160),
  model: optionalText(160),
  protocol: optionalText(80),
  controllerCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z][A-Z0-9]{0,7}$/, "Use 1–8 uppercase letters or digits."),
  outputCount: z.coerce.number().int().min(1).max(128),
  powerBankCount: z.coerce.number().int().min(1).max(32),
  maximumNodesPerOutput: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.coerce.number().int().positive().max(1_000_000).optional(),
  ),
  maximumCurrentPerOutputA: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    positiveDecimal("Maximum output current").optional(),
  ),
  notes: optionalText(1000),
});

export const assignOutputInputSchema = z.object({
  componentPositionId: z.string().uuid("Select a display element position."),
  propNumber: z.coerce.number().int().min(1).max(999),
  stringNumber: z.coerce.number().int().min(1).max(99),
  reason: z.string().trim().min(1, "Enter an assignment reason.").max(500),
});

export const createPsuInputSchema = z.object({
  assetId: z.string().uuid("Select a power supply asset."),
  name: z.string().trim().min(1, "Enter a PSU definition name.").max(160),
  manufacturer: optionalText(160),
  model: optionalText(160),
  outputVoltageV: positiveDecimal("Output voltage"),
  maximumCurrentA: positiveDecimal("Maximum current"),
  maximumPowerW: positiveDecimal("Maximum power"),
  notes: optionalText(1000),
});

export const allocatePowerInputSchema = z.object({
  psuAssetId: z.string().uuid("Select a physical PSU."),
  reason: z.string().trim().min(1, "Enter an allocation reason.").max(500),
});
