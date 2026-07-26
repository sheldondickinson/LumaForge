import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/live/route";

describe("liveness endpoint", () => {
  it("reports the application as live without requiring the database", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      service: "lumaforge",
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
