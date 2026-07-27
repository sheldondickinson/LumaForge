export const developmentSessionCookieName = "lumaforge-session";
export const productionSessionCookieName = "__Host-lumaforge-session";
export const sessionDurationMilliseconds = 12 * 60 * 60 * 1000;

type SessionCookieEnvironment = {
  nodeEnvironment?: string;
  appUrl?: string;
};
type SessionCookieEnvironmentInput = SessionCookieEnvironment | string;

function isHttpLoopback(appUrl: string | undefined) {
  if (!appUrl) return false;

  try {
    const url = new URL(appUrl);
    return (
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]", "::1"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

function resolveSessionCookieEnvironment(
  environment?: SessionCookieEnvironmentInput,
) {
  return typeof environment === "string"
    ? { nodeEnvironment: environment, appUrl: process.env.APP_URL }
    : {
        nodeEnvironment: environment?.nodeEnvironment ?? process.env.NODE_ENV,
        appUrl: environment?.appUrl ?? process.env.APP_URL,
      };
}

export function shouldUseSecureSessionCookie(
  environment?: SessionCookieEnvironmentInput,
) {
  const { nodeEnvironment, appUrl } =
    resolveSessionCookieEnvironment(environment);
  return nodeEnvironment === "production" && !isHttpLoopback(appUrl);
}

export function getSessionCookieName(
  environment?: SessionCookieEnvironmentInput,
) {
  return shouldUseSecureSessionCookie(environment)
    ? productionSessionCookieName
    : developmentSessionCookieName;
}

export function getSessionCookieOptions(
  expires: Date,
  environment?: SessionCookieEnvironmentInput,
) {
  return {
    httpOnly: true,
    secure: shouldUseSecureSessionCookie(environment),
    sameSite: "strict" as const,
    path: "/",
    expires,
    priority: "high" as const,
  };
}
