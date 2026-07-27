"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { FormActionState } from "@/lib/actions/state";
import { createAssets } from "@/lib/assets/service";
import { createAssetRelationship } from "@/lib/assemblies/service";
import { requireCurrentAuthentication } from "@/lib/auth/current-user";
import { moveAsset } from "@/lib/locations/service";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { createAssetsInputSchema } from "@/lib/validation/assets";
import { createRelationshipInputSchema } from "@/lib/validation/assemblies";
import { moveAssetInputSchema } from "@/lib/validation/locations";

export async function createAssetsAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const requestHeaders = await headers();
  assertTrustedOrigin(requestHeaders.get("origin"));
  const { user } = await requireCurrentAuthentication();
  const result = createAssetsInputSchema.safeParse({
    assetClassId: formData.get("assetClassId"),
    productRevisionId: formData.get("productRevisionId"),
    quantity: formData.get("quantity"),
    friendlyNameBase: formData.get("friendlyNameBase"),
    status: formData.get("status"),
    actualPixelCount: formData.get("actualPixelCount"),
    overrideReason: formData.get("overrideReason"),
    notes: formData.get("notes"),
  });

  if (!result.success) {
    return {
      message: "Review the highlighted asset details.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  let firstAssetId: string;
  try {
    const created = await createAssets(result.data, user);
    const firstAsset = created[0];
    if (!firstAsset) {
      throw new Error("No assets were created.");
    }
    firstAssetId = firstAsset.id;
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "The assets could not be created.",
    };
  }

  revalidatePath("/assets");
  redirect(result.data.quantity === 1 ? `/assets/${firstAssetId}` : "/assets");
}

export async function moveAssetAction(
  assetId: string,
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const requestHeaders = await headers();
  assertTrustedOrigin(requestHeaders.get("origin"));
  const { user } = await requireCurrentAuthentication();
  const result = moveAssetInputSchema.safeParse({
    locationId: formData.get("locationId"),
    reason: formData.get("reason"),
  });

  if (!result.success) {
    return {
      message: "Review the movement details.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  try {
    await moveAsset(assetId, result.data, user);
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "The asset could not be moved.",
    };
  }

  revalidatePath("/assets");
  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/locations");
  redirect(`/assets/${assetId}`);
}

export async function createAssetRelationshipAction(
  assetId: string,
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  assertTrustedOrigin((await headers()).get("origin"));
  const { user } = await requireCurrentAuthentication();
  const result = createRelationshipInputSchema.safeParse({
    relationshipType: formData.get("relationshipType"),
    targetAssetId: formData.get("targetAssetId"),
    sourceConnector: formData.get("sourceConnector"),
    targetConnector: formData.get("targetConnector"),
    notes: formData.get("notes"),
  });
  if (!result.success) {
    return {
      message: "Review the relationship details.",
      errors: result.error.flatten().fieldErrors,
    };
  }
  try {
    await createAssetRelationship(assetId, result.data, user);
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "The relationship could not be created.",
    };
  }
  revalidatePath(`/assets/${assetId}`);
  redirect(`/assets/${assetId}`);
}
