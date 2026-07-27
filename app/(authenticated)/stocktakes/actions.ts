"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { FormActionState } from "@/lib/actions/state";
import { requireCurrentAuthentication } from "@/lib/auth/current-user";
import { assertTrustedOrigin } from "@/lib/security/origin";
import {
  completeStocktake,
  createStocktake,
  scanStocktakeAsset,
} from "@/lib/stocktakes/service";
import {
  createStocktakeInputSchema,
  scanStocktakeAssetInputSchema,
} from "@/lib/validation/stocktakes";

export async function createStocktakeAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const requestHeaders = await headers();
  assertTrustedOrigin(requestHeaders.get("origin"));
  const { user } = await requireCurrentAuthentication();
  const result = createStocktakeInputSchema.safeParse({
    locationId: formData.get("locationId"),
    name: formData.get("name"),
    notes: formData.get("notes"),
  });

  if (!result.success) {
    return {
      message: "Review the stocktake details.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  let stocktakeId: string;
  try {
    const stocktake = await createStocktake(result.data, user);
    stocktakeId = stocktake.id;
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "The stocktake could not be started.",
    };
  }

  revalidatePath("/stocktakes");
  redirect(`/stocktakes/${stocktakeId}`);
}

export async function scanStocktakeAssetAction(
  stocktakeId: string,
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const requestHeaders = await headers();
  assertTrustedOrigin(requestHeaders.get("origin"));
  const { user } = await requireCurrentAuthentication();
  const result = scanStocktakeAssetInputSchema.safeParse({
    assetIdentifier: formData.get("assetIdentifier"),
    notes: formData.get("notes"),
  });

  if (!result.success) {
    return {
      message: "Enter or scan a valid permanent asset ID.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  try {
    await scanStocktakeAsset(stocktakeId, result.data, user);
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "The scan could not be saved.",
    };
  }

  revalidatePath(`/stocktakes/${stocktakeId}`);
  return { message: `${result.data.assetIdentifier} recorded.` };
}

export async function completeStocktakeAction(
  stocktakeId: string,
  formData: FormData,
) {
  const requestHeaders = await headers();
  assertTrustedOrigin(requestHeaders.get("origin"));
  if (formData.get("confirmation") !== "complete") {
    throw new Error("Stocktake completion was not confirmed.");
  }
  const { user } = await requireCurrentAuthentication();
  await completeStocktake(stocktakeId, user);
  revalidatePath("/stocktakes");
  revalidatePath(`/stocktakes/${stocktakeId}`);
  redirect(`/stocktakes/${stocktakeId}`);
}
