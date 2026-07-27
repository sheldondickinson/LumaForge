"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSessionCookieName,
  getSessionCookieOptions,
} from "@/lib/auth/constants";
import { authenticateWithPassword } from "@/lib/auth/service";
import { assertTrustedOrigin } from "@/lib/security/origin";

export type LoginActionState = {
  message: string | null;
};

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const requestHeaders = await headers();
  assertTrustedOrigin(requestHeaders.get("origin"));

  const result = await authenticateWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    userAgent: requestHeaders.get("user-agent"),
  });

  if (result.status === "invalid") {
    return { message: result.message };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    getSessionCookieName(),
    result.sessionToken,
    getSessionCookieOptions(result.expiresAt),
  );
  redirect("/");
}
