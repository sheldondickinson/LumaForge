import { describe, expect, it } from "vitest";
import {
  generateSessionToken,
  hashSessionToken,
} from "@/lib/auth/session-token";

describe("session tokens", () => {
  it("generates unpredictable opaque tokens and stores only stable hashes", () => {
    const firstToken = generateSessionToken();
    const secondToken = generateSessionToken();

    expect(firstToken).not.toBe(secondToken);
    expect(firstToken.length).toBeGreaterThanOrEqual(40);
    expect(hashSessionToken(firstToken)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashSessionToken(firstToken)).toBe(hashSessionToken(firstToken));
    expect(hashSessionToken(firstToken)).not.toBe(
      hashSessionToken(secondToken),
    );
  });
});
