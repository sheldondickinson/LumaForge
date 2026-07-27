"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { FormActionState } from "@/lib/actions/state";
import { requireCurrentAuthentication } from "@/lib/auth/current-user";
import { createProduct, createProductRevision } from "@/lib/products/service";
import { assertTrustedOrigin } from "@/lib/security/origin";
import {
  createProductInputSchema,
  productRevisionInputSchema,
} from "@/lib/validation/products";

function productFormInput(formData: FormData) {
  return {
    assetClassId: formData.get("assetClassId"),
    name: formData.get("name"),
    manufacturer: formData.get("manufacturer"),
    model: formData.get("model"),
    description: formData.get("description"),
    voltageV: formData.get("voltageV"),
    pixelCount: formData.get("pixelCount"),
    currentPerPixelMa: formData.get("currentPerPixelMa"),
    spacingMm: formData.get("spacingMm"),
    protocol: formData.get("protocol"),
    connector: formData.get("connector"),
    changeSummary: formData.get("changeSummary"),
  };
}

export async function createProductAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const requestHeaders = await headers();
  assertTrustedOrigin(requestHeaders.get("origin"));
  const { user } = await requireCurrentAuthentication();
  const result = createProductInputSchema.safeParse(productFormInput(formData));

  if (!result.success) {
    return {
      message: "Review the highlighted product details.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  let productId: string;
  try {
    const product = await createProduct(result.data, user);
    productId = product.id;
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "The product could not be created.",
    };
  }

  revalidatePath("/products");
  redirect(`/products/${productId}`);
}

export async function createProductRevisionAction(
  productId: string,
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const requestHeaders = await headers();
  assertTrustedOrigin(requestHeaders.get("origin"));
  const { user } = await requireCurrentAuthentication();
  const result = productRevisionInputSchema.safeParse(
    productFormInput(formData),
  );

  if (!result.success) {
    return {
      message: "Review the highlighted revision details.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  try {
    await createProductRevision(productId, result.data, user);
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "The product revision could not be created.",
    };
  }

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  redirect(`/products/${productId}`);
}
