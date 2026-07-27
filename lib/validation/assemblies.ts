import { z } from "zod";

const optionalText = (maximum: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(maximum).optional(),
  );

export const createDisplayElementInputSchema = z.object({
  assetId: z.string().uuid("Select a prop asset."),
  name: z.string().trim().min(1, "Enter an element name.").max(160),
  description: optionalText(1000),
  positions: z
    .preprocess(
      (value) =>
        typeof value === "string"
          ? value
              .split("\n")
              .map((position) => position.trim())
              .filter(Boolean)
          : value,
      z
        .array(z.string().trim().min(1))
        .min(1, "Enter at least one component position."),
    )
    .refine((positions) => positions.length <= 100, {
      message: "An element can have at most 100 positions.",
    })
    .refine(
      (positions) =>
        new Set(positions.map((position) => position.toLowerCase())).size ===
        positions.length,
      { message: "Position names must be unique." },
    ),
});

export const assignComponentInputSchema = z.object({
  componentAssetId: z.string().uuid("Select a component asset."),
  notes: optionalText(1000),
});

export const createRelationshipInputSchema = z.object({
  relationshipType: z.enum([
    "contains",
    "mounted_on",
    "connected_to",
    "component_of",
  ]),
  targetAssetId: z.string().uuid("Select a related asset."),
  sourceConnector: optionalText(100),
  targetConnector: optionalText(100),
  notes: optionalText(1000),
});
