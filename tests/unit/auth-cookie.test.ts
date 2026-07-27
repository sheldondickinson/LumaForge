import { describe, expect, it } from "vitest";
import {
  developmentSessionCookieName,
  getSessionCookieName,
  getSessionCookieOptions,
  productionSessionCookieName,
} from "@/lib/auth/constants";

describe("session cookie configuration", () => {
  it("uses an HTTP-compatible cookie for the local production container", () => {
    const environment = {
      nodeEnvironment: "production",
      appUrl: "http://localhost:3000",
    };

    expect(getSessionCookieName(environment)).toBe(
      developmentSessionCookieName,
    );
    expect(
      getSessionCookieOptions(new Date("2026-07-27T00:00:00Z"), environment)
        .secure,
    ).toBe(false);
  });

  it("uses the secure host cookie for HTTPS production", () => {
    const environment = {
      nodeEnvironment: "production",
      appUrl: "https://lumaforge.example.test",
    };

    expect(getSessionCookieName(environment)).toBe(productionSessionCookieName);
    expect(
      getSessionCookieOptions(new Date("2026-07-27T00:00:00Z"), environment)
        .secure,
    ).toBe(true);
  });

  it("fails secure for non-loopback HTTP production URLs", () => {
    const environment = {
      nodeEnvironment: "production",
      appUrl: "http://lumaforge.lan",
    };

    expect(getSessionCookieName(environment)).toBe(productionSessionCookieName);
    expect(
      getSessionCookieOptions(new Date("2026-07-27T00:00:00Z"), environment)
        .secure,
    ).toBe(true);
  });
});
