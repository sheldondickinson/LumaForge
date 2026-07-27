"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { FormActionState } from "@/lib/actions/state";
import { requireCurrentAuthentication } from "@/lib/auth/current-user";
import { allocatePower, createPsu } from "@/lib/controllers-power/service";
import { assertTrustedOrigin } from "@/lib/security/origin";
import {
  allocatePowerInputSchema,
  createPsuInputSchema,
} from "@/lib/validation/controllers-power";

export async function createPsuAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  assertTrustedOrigin((await headers()).get("origin"));
  const { user } = await requireCurrentAuthentication();
  const result = createPsuInputSchema.safeParse({
    assetId: formData.get("assetId"),
    name: formData.get("name"),
    manufacturer: formData.get("manufacturer"),
    model: formData.get("model"),
    outputVoltageV: formData.get("outputVoltageV"),
    maximumCurrentA: formData.get("maximumCurrentA"),
    maximumPowerW: formData.get("maximumPowerW"),
    notes: formData.get("notes"),
  });
  if (!result.success) {
    return {
      message: "Review the power supply details.",
      errors: result.error.flatten().fieldErrors,
    };
  }
  try {
    await createPsu(result.data, user);
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "The power supply could not be configured.",
    };
  }
  revalidatePath("/power");
  redirect("/power");
}

export async function allocatePowerAction(
  bankId: string,
  controllerId: string,
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  assertTrustedOrigin((await headers()).get("origin"));
  const { user } = await requireCurrentAuthentication();
  const result = allocatePowerInputSchema.safeParse({
    psuAssetId: formData.get("psuAssetId"),
    reason: formData.get("reason"),
  });
  if (!result.success) {
    return {
      message: "Review the power allocation.",
      errors: result.error.flatten().fieldErrors,
    };
  }
  try {
    await allocatePower(bankId, result.data, user);
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "The power allocation could not be recorded.",
    };
  }
  revalidatePath("/power");
  revalidatePath(`/controllers/${controllerId}`);
  redirect("/power");
}
