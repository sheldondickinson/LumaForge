"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { FormActionState } from "@/lib/actions/state";
import { requireCurrentAuthentication } from "@/lib/auth/current-user";
import { createLocation } from "@/lib/locations/service";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { createLocationInputSchema } from "@/lib/validation/locations";

export async function createLocationAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const requestHeaders = await headers();
  assertTrustedOrigin(requestHeaders.get("origin"));
  const { user } = await requireCurrentAuthentication();
  const result = createLocationInputSchema.safeParse({
    parentId: formData.get("parentId"),
    kind: formData.get("kind"),
    code: formData.get("code"),
    name: formData.get("name"),
    notes: formData.get("notes"),
  });

  if (!result.success) {
    return {
      message: "Review the highlighted location details.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  try {
    await createLocation(result.data, user);
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "The location could not be created.",
    };
  }

  revalidatePath("/locations");
  redirect("/locations");
}
