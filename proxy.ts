import { NextResponse, type NextRequest } from "next/server";
import {
  developmentSessionCookieName,
  productionSessionCookieName,
} from "@/lib/auth/constants";

const publicPaths = ["/login", "/api/health/live", "/api/health/ready"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  const hasSessionCookie =
    request.cookies.has(developmentSessionCookieName) ||
    request.cookies.has(productionSessionCookieName);

  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
