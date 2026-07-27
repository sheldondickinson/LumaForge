"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { FormActionState } from "@/lib/actions/state";
import { createAssets } from "@/lib/assets/service";
import { requireCurrentAuthentication } from "@/lib/auth/current-user";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { createAssetsInputSchema } from "@/lib/validation/assets";

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
