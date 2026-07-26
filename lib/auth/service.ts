import { and, eq, gt, isNull } from "drizzle-orm";
import { getDatabaseConnection } from "@/db/client";
import { sessions, users } from "@/db/schema";
import { recordAuditEvent } from "@/lib/audit/service";
import { sessionDurationMilliseconds } from "@/lib/auth/constants";
import {
  dummyPasswordHash,
  hashPassword,
  verifyPassword,
} from "@/lib/auth/password";
import {
  clearFailedLogins,
  hashLoginIdentifier,
  isLoginBlocked,
  recordFailedLogin,
} from "@/lib/auth/rate-limit";
import {
  generateSessionToken,
  hashSessionToken,
} from "@/lib/auth/session-token";
import {
  administratorBootstrapSchema,
  loginSchema,
  type UserRole,
} from "@/lib/validation/auth";

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
};

type AuthenticationResult =
  | {
      status: "authenticated";
      user: AuthenticatedUser;
      sessionToken: string;
      expiresAt: Date;
    }
  | {
      status: "invalid";
      message: string;
    };

export class AdministratorAlreadyExistsError extends Error {
  constructor() {
    super("An administrator has already been initialised.");
    this.name = "AdministratorAlreadyExistsError";
  }
}

export async function createFirstAdministrator(input: {
  email: string;
  password: string;
}) {
  const validated = administratorBootstrapSchema.parse(input);
  const passwordHash = await hashPassword(validated.password);
  const { client } = getDatabaseConnection();

  return client.begin(async (transaction) => {
    await transaction`
      select pg_advisory_xact_lock(hashtext('lumaforge:first-administrator'))
    `;

    const [existing] = await transaction<{ count: string }[]>`
      select count(*)::text as count from users
    `;

    if (existing?.count !== "0") {
      throw new AdministratorAlreadyExistsError();
    }

    const [user] = await transaction<
      { id: string; email: string; role: UserRole }[]
    >`
      insert into users (email, password_hash, role)
      values (${validated.email}, ${passwordHash}, 'administrator')
      returning id, email, role
    `;

    if (!user) {
      throw new Error("Administrator creation did not return a user.");
    }

    await transaction`
      insert into audit_events (
        actor_type,
        actor_id,
        action,
        entity_type,
        entity_id,
        details
      )
      values (
        'administrator',
        ${user.id},
        'authentication.administrator_created',
        'user',
        ${user.id},
        ${JSON.stringify({ bootstrapMethod: "cli" })}::jsonb
      )
    `;

    return user;
  });
}

export async function authenticateWithPassword(input: {
  email: string;
  password: string;
  userAgent?: string | null;
}): Promise<AuthenticationResult> {
  const validated = loginSchema.safeParse(input);
  const invalidResult = {
    status: "invalid" as const,
    message: "The email address or password is incorrect.",
  };

  if (!validated.success) {
    return invalidResult;
  }

  const identifierHash = hashLoginIdentifier(validated.data.email);

  if (await isLoginBlocked(identifierHash)) {
    return {
      status: "invalid",
      message: "Sign-in is temporarily unavailable. Try again in 15 minutes.",
    };
  }

  const { db } = getDatabaseConnection();
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.email, validated.data.email))
    .limit(1);

  const passwordIsValid = await verifyPassword(
    user?.passwordHash ?? dummyPasswordHash,
    validated.data.password,
  );

  if (!user || !user.isActive || !passwordIsValid) {
    await recordFailedLogin(identifierHash);
    await recordAuditEvent({
      actorType: "system",
      action: "authentication.login_failed",
      entityType: "authentication",
      details: {
        identifierHash,
        reason:
          user && !user.isActive ? "inactive_user" : "invalid_credentials",
      },
    });
    return invalidResult;
  }

  await clearFailedLogins(identifierHash);

  const sessionToken = generateSessionToken();
  const tokenHash = hashSessionToken(sessionToken);
  const expiresAt = new Date(Date.now() + sessionDurationMilliseconds);

  await db.transaction(async (transaction) => {
    await transaction.insert(sessions).values({
      userId: user.id,
      tokenHash,
      expiresAt,
      userAgent: input.userAgent?.slice(0, 512) ?? null,
    });

    await transaction
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
  });

  await recordAuditEvent({
    actorType: user.role,
    actorId: user.id,
    action: "authentication.login_succeeded",
    entityType: "session",
    details: { sessionExpiresAt: expiresAt.toISOString() },
  });

  return {
    status: "authenticated",
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    sessionToken,
    expiresAt,
  };
}

export async function findAuthenticatedUser(
  sessionToken: string,
): Promise<AuthenticatedUser | null> {
  const { db } = getDatabaseConnection();
  const tokenHash = hashSessionToken(sessionToken);
  const now = new Date();

  const [result] = await db
    .select({
      sessionId: sessions.id,
      userId: users.id,
      email: users.email,
      role: users.role,
      lastSeenAt: sessions.lastSeenAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
        eq(users.isActive, true),
      ),
    )
    .limit(1);

  if (!result) {
    return null;
  }

  if (now.getTime() - result.lastSeenAt.getTime() > 5 * 60 * 1000) {
    await db
      .update(sessions)
      .set({ lastSeenAt: now })
      .where(eq(sessions.id, result.sessionId));
  }

  return {
    id: result.userId,
    email: result.email,
    role: result.role,
  };
}

export async function revokeSession(
  sessionToken: string,
  user: AuthenticatedUser,
) {
  const { db } = getDatabaseConnection();
  const tokenHash = hashSessionToken(sessionToken);
  const [revoked] = await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        eq(sessions.userId, user.id),
        isNull(sessions.revokedAt),
      ),
    )
    .returning({ id: sessions.id });

  if (revoked) {
    await recordAuditEvent({
      actorType: user.role,
      actorId: user.id,
      action: "authentication.logout",
      entityType: "session",
      entityId: revoked.id,
    });
  }
}
