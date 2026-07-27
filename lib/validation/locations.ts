import { z } from "zod";

export const locationKinds = [
  "shed",
  "rack",
  "shelf",
  "tote",
  "zone",
  "bin",
  "other",
] as const;

export const locationKindSchema = z.enum(locationKinds);
export type LocationKind = z.infer<typeof locationKindSchema>;

const optionalText = (maximumLength: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(maximumLength).optional(),
  );

const optionalUuid = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().uuid().optional(),
);

export const createLocationInputSchema = z.object({
  parentId: optionalUuid,
  kind: locationKindSchema,
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z][A-Z0-9-]{1,31}$/,
      "Use 2–32 uppercase letters, numbers or hyphens.",
    ),
  name: z.string().trim().min(2).max(120),
  notes: optionalText(2_000),
});

export const moveAssetInputSchema = z.object({
  locationId: z.preprocess(
    (value) =>
      typeof value === "string" &&
      (value.trim() === "" || value === "__unlocated__")
        ? null
        : value,
    z.string().uuid().nullable(),
  ),
  reason: z.string().trim().min(2).max(500),
});

export type CreateLocationInput = z.infer<typeof createLocationInputSchema>;
export type MoveAssetInput = z.infer<typeof moveAssetInputSchema>;
