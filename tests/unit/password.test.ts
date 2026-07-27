import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("uses Argon2id and verifies only the correct password", async () => {
    const hash = await hashPassword("Correct-Horse-Battery-Staple-2026");

    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(
      verifyPassword(hash, "Correct-Horse-Battery-Staple-2026"),
    ).resolves.toBe(true);
    await expect(verifyPassword(hash, "incorrect-password")).resolves.toBe(
      false,
    );
  });
});
