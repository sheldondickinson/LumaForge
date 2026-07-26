export const developmentSessionCookieName = "lumaforge-session";
export const productionSessionCookieName = "__Host-lumaforge-session";
export const sessionDurationMilliseconds = 12 * 60 * 60 * 1000;

export function getSessionCookieName(nodeEnvironment = process.env.NODE_ENV) {
  return nodeEnvironment === "production"
    ? productionSessionCookieName
    : developmentSessionCookieName;
}

export function getSessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    expires,
    priority: "high" as const,
  };
}
