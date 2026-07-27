"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSessionCookieName,
  getSessionCookieOptions,
} from "@/lib/auth/constants";
import { getCurrentAuthentication } from "@/lib/auth/current-user";
import { revokeSession } from "@/lib/auth/service";
import { assertTrustedOrigin } from "@/lib/security/origin";

export async function logoutAction() {
  const requestHeaders = await headers();
  assertTrustedOrigin(requestHeaders.get("origin"));

  const authentication = await getCurrentAuthentication();
  const cookieStore = await cookies();
  const cookieName = getSessionCookieName();

  if (authentication) {
    await revokeSession(authentication.token, authentication.user);
  }

  cookieStore.set(cookieName, "", getSessionCookieOptions(new Date(0)));
  redirect("/login");
}
