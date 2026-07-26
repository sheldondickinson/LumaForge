import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection, createDatabaseClient } from "@/db/client";
import { auditEvents, authRateLimits, sessions, users } from "@/db/schema";
import {
  AdministratorAlreadyExistsError,
  authenticateWithPassword,
  createFirstAdministrator,
  findAuthenticatedUser,
  revokeSession,
} from "@/lib/auth/service";
import { hashLoginIdentifier } from "@/lib/auth/rate-limit";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("authentication integration", () => {
  const connection = hasDatabase ? createDatabaseClient() : undefined;
  const email = `auth-${randomUUID()}@example.test`;
  const password = "Correct-Horse-Battery-Staple-2026";
  let userId: string;

  beforeAll(async () => {
    if (!connection) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }

    const user = await createFirstAdministrator({ email, password });
    userId = user.id;
  });

  afterAll(async () => {
    if (!connection || !userId) {
      return;
    }

    await connection.db.delete(sessions).where(eq(sessions.userId, userId));
    await connection.db
      .delete(auditEvents)
      .where(eq(auditEvents.actorId, userId));
    await connection.db.delete(users).where(eq(users.id, userId));
    await connection.db
      .delete(authRateLimits)
      .where(eq(authRateLimits.identifierHash, hashLoginIdentifier(email)));
    await connection.client.end();
    await closeDatabaseConnection();
  });

  it("allows only the transaction-locked first administrator", async () => {
    await expect(
      createFirstAdministrator({
        email: `second-${randomUUID()}@example.test`,
        password: "Another-Correct-Horse-Battery-Staple",
      }),
    ).rejects.toBeInstanceOf(AdministratorAlreadyExistsError);
  });

  it("creates, resolves, audits, and revokes a secure session", async () => {
    const result = await authenticateWithPassword({
      email,
      password,
      userAgent: "Vitest",
    });

    expect(result.status).toBe("authenticated");
    if (result.status !== "authenticated") {
      throw new Error("Authentication unexpectedly failed.");
    }

    await expect(findAuthenticatedUser(result.sessionToken)).resolves.toEqual({
      id: userId,
      email,
      role: "administrator",
    });

    await revokeSession(result.sessionToken, result.user);
    await expect(
      findAuthenticatedUser(result.sessionToken),
    ).resolves.toBeNull();

    if (!connection) {
      throw new Error("Database connection is unavailable.");
    }

    const events = await connection.db
      .select({ action: auditEvents.action })
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.actorId, userId),
          eq(auditEvents.entityType, "session"),
        ),
      );
    expect(events.map(({ action }) => action)).toEqual(
      expect.arrayContaining([
        "authentication.login_succeeded",
        "authentication.logout",
      ]),
    );
  });

  it("rate limits repeated invalid credentials without revealing the account", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const result = await authenticateWithPassword({
        email,
        password: "not-the-password",
      });
      expect(result.status).toBe("invalid");
      if (result.status !== "invalid") {
        throw new Error("Invalid credentials unexpectedly authenticated.");
      }
      expect(result.message).toBe(
        "The email address or password is incorrect.",
      );
    }

    const blocked = await authenticateWithPassword({
      email,
      password,
    });
    expect(blocked).toEqual({
      status: "invalid",
      message: "Sign-in is temporarily unavailable. Try again in 15 minutes.",
    });
  });
});
