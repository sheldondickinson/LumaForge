import { describe, expect, it } from "vitest";
import { isTrustedOrigin } from "@/lib/security/origin";

describe("request origin validation", () => {
  it("accepts only the configured protocol and host", () => {
    expect(
      isTrustedOrigin(
        "https://lights.example.test",
        "https://lights.example.test",
      ),
    ).toBe(true);
    expect(
      isTrustedOrigin(
        "http://lights.example.test",
        "https://lights.example.test",
      ),
    ).toBe(false);
    expect(
      isTrustedOrigin(
        "https://attacker.example.test",
        "https://lights.example.test",
      ),
    ).toBe(false);
    expect(isTrustedOrigin(null, "https://lights.example.test")).toBe(false);
  });
});
