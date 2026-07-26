import { getServerEnvironment } from "@/lib/env";

export function isTrustedOrigin(origin: string | null, appUrl: string) {
  if (!origin) {
    return false;
  }

  try {
    const supplied = new URL(origin);
    const expected = new URL(appUrl);
    return (
      supplied.protocol === expected.protocol && supplied.host === expected.host
    );
  } catch {
    return false;
  }
}

export function assertTrustedOrigin(origin: string | null) {
  const { APP_URL } = getServerEnvironment();

  if (!isTrustedOrigin(origin, APP_URL)) {
    throw new Error("Untrusted request origin.");
  }
}
