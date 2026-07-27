import { describe, expect, it } from "vitest";
import {
  administratorBootstrapSchema,
  emailSchema,
  passwordSchema,
} from "@/lib/validation/auth";

describe("authentication validation", () => {
  it("normalises administrator email addresses", () => {
    expect(emailSchema.parse("  Admin@Example.COM ")).toBe("admin@example.com");
  });

  it("requires a long password", () => {
    const result = passwordSchema.safeParse("too-short");
    expect(result.success).toBe(false);
  });

  it("rejects a password containing the email username", () => {
    const result = administratorBootstrapSchema.safeParse({
      email: "shed-admin@example.com",
      password: "CorrectHorseShed-Admin!",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a long password unrelated to the account name", () => {
    const result = administratorBootstrapSchema.safeParse({
      email: "shed-admin@example.com",
      password: "Correct-Horse-Battery-Staple-2026",
    });
    expect(result.success).toBe(true);
  });
});
