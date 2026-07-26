import { createHmac } from "node:crypto";
import { getDatabaseConnection } from "@/db/client";
import { getServerEnvironment } from "@/lib/env";

const maximumFailedAttempts = 5;

export function hashLoginIdentifier(email: string) {
  const { AUTH_SECRET } = getServerEnvironment();
  return createHmac("sha256", AUTH_SECRET)
    .update(`login:${email.toLowerCase()}`, "utf8")
    .digest("hex");
}

export async function isLoginBlocked(identifierHash: string) {
  const { client } = getDatabaseConnection();
  const [record] = await client<
    { blocked_until: Date | null; failed_count: number }[]
  >`
    select blocked_until, failed_count
    from auth_rate_limits
    where identifier_hash = ${identifierHash}
  `;

  return Boolean(
    record?.blocked_until && record.blocked_until.getTime() > Date.now(),
  );
}

export async function recordFailedLogin(identifierHash: string) {
  const { client } = getDatabaseConnection();

  await client`
    insert into auth_rate_limits (
      identifier_hash,
      window_started_at,
      failed_count,
      blocked_until,
      updated_at
    )
    values (${identifierHash}, now(), 1, null, now())
    on conflict (identifier_hash) do update
    set
      failed_count = case
        when auth_rate_limits.window_started_at < now() - interval '15 minutes'
          then 1
        else auth_rate_limits.failed_count + 1
      end,
      window_started_at = case
        when auth_rate_limits.window_started_at < now() - interval '15 minutes'
          then now()
        else auth_rate_limits.window_started_at
      end,
      blocked_until = case
        when auth_rate_limits.window_started_at >= now() - interval '15 minutes'
          and auth_rate_limits.failed_count + 1 >= ${maximumFailedAttempts}
          then now() + interval '15 minutes'
        else null
      end,
      updated_at = now()
  `;
}

export async function clearFailedLogins(identifierHash: string) {
  const { client } = getDatabaseConnection();
  await client`
    delete from auth_rate_limits
    where identifier_hash = ${identifierHash}
  `;
}
