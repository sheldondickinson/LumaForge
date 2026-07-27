import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName } from "@/lib/auth/constants";
import {
  findAuthenticatedUser,
  type AuthenticatedUser,
} from "@/lib/auth/service";

export async function getCurrentAuthentication(): Promise<{
  token: string;
  user: AuthenticatedUser;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;

  if (!token) {
    return null;
  }

  const user = await findAuthenticatedUser(token);
  return user ? { token, user } : null;
}

export async function requireCurrentAuthentication() {
  const authentication = await getCurrentAuthentication();

  if (!authentication) {
    redirect("/login");
  }

  return authentication;
}
