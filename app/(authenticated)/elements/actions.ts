"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { FormActionState } from "@/lib/actions/state";
import {
  assignComponent,
  createDisplayElement,
} from "@/lib/assemblies/service";
import { requireCurrentAuthentication } from "@/lib/auth/current-user";
import { assertTrustedOrigin } from "@/lib/security/origin";
import {
  assignComponentInputSchema,
  createDisplayElementInputSchema,
} from "@/lib/validation/assemblies";

export async function createDisplayElementAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  assertTrustedOrigin((await headers()).get("origin"));
  const { user } = await requireCurrentAuthentication();
  const result = createDisplayElementInputSchema.safeParse({
    assetId: formData.get("assetId"),
    name: formData.get("name"),
    description: formData.get("description"),
    positions: formData.get("positions"),
  });
  if (!result.success) {
    return {
      message: "Review the display element details.",
      errors: result.error.flatten().fieldErrors,
    };
  }
  let id: string;
  try {
    const element = await createDisplayElement(result.data, user);
    id = element.id;
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "The display element could not be created.",
    };
  }
  revalidatePath("/elements");
  redirect(`/elements/${id}`);
}

export async function assignComponentAction(
  elementId: string,
  positionId: string,
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  assertTrustedOrigin((await headers()).get("origin"));
  const { user } = await requireCurrentAuthentication();
  const result = assignComponentInputSchema.safeParse({
    componentAssetId: formData.get("componentAssetId"),
    notes: formData.get("notes"),
  });
  if (!result.success) {
    return {
      message: "Review the component assignment.",
      errors: result.error.flatten().fieldErrors,
    };
  }
  try {
    await assignComponent(positionId, result.data, user);
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "The component could not be assigned.",
    };
  }
  revalidatePath(`/elements/${elementId}`);
  redirect(`/elements/${elementId}`);
}
