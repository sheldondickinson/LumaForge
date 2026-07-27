"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { FormActionState } from "@/lib/actions/state";
import { requireCurrentAuthentication } from "@/lib/auth/current-user";
import {
  assignOutput,
  createController,
} from "@/lib/controllers-power/service";
import { assertTrustedOrigin } from "@/lib/security/origin";
import {
  overrideValidationResult,
  runControllerValidation,
} from "@/lib/validations/service";
import {
  assignOutputInputSchema,
  createControllerInputSchema,
} from "@/lib/validation/controllers-power";

export async function createControllerAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  assertTrustedOrigin((await headers()).get("origin"));
  const { user } = await requireCurrentAuthentication();
  const result = createControllerInputSchema.safeParse({
    assetId: formData.get("assetId"),
    name: formData.get("name"),
    manufacturer: formData.get("manufacturer"),
    model: formData.get("model"),
    protocol: formData.get("protocol"),
    controllerCode: formData.get("controllerCode"),
    outputCount: formData.get("outputCount"),
    powerBankCount: formData.get("powerBankCount"),
    maximumNodesPerOutput: formData.get("maximumNodesPerOutput"),
    maximumCurrentPerOutputA: formData.get("maximumCurrentPerOutputA"),
    notes: formData.get("notes"),
  });
  if (!result.success) {
    return {
      message: "Review the controller details.",
      errors: result.error.flatten().fieldErrors,
    };
  }
  let id: string;
  try {
    id = (await createController(result.data, user)).id;
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "The controller could not be created.",
    };
  }
  revalidatePath("/controllers");
  redirect(`/controllers/${id}`);
}

export async function assignOutputAction(
  controllerId: string,
  outputId: string,
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  assertTrustedOrigin((await headers()).get("origin"));
  const { user } = await requireCurrentAuthentication();
  const result = assignOutputInputSchema.safeParse({
    componentPositionId: formData.get("componentPositionId"),
    propNumber: formData.get("propNumber"),
    stringNumber: formData.get("stringNumber"),
    reason: formData.get("reason"),
  });
  if (!result.success) {
    return {
      message: "Review the output assignment.",
      errors: result.error.flatten().fieldErrors,
    };
  }
  try {
    await assignOutput(outputId, result.data, user);
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "The output assignment could not be created.",
    };
  }
  revalidatePath(`/controllers/${controllerId}`);
  redirect(`/controllers/${controllerId}`);
}

export async function runControllerValidationAction(controllerId: string) {
  assertTrustedOrigin((await headers()).get("origin"));
  const { user } = await requireCurrentAuthentication();
  await runControllerValidation(controllerId, user);
  revalidatePath(`/controllers/${controllerId}`);
  redirect(`/controllers/${controllerId}`);
}

export async function overrideValidationResultAction(
  controllerId: string,
  resultId: string,
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  assertTrustedOrigin((await headers()).get("origin"));
  const { user } = await requireCurrentAuthentication();
  try {
    await overrideValidationResult(
      resultId,
      { reason: formData.get("reason") },
      user,
    );
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "The override was not recorded.",
    };
  }
  revalidatePath(`/controllers/${controllerId}`);
  redirect(`/controllers/${controllerId}`);
}
