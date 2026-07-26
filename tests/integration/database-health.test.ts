import { afterAll, describe, expect, it } from "vitest";
import { createDatabaseClient } from "@/db/client";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("PostgreSQL integration", () => {
  const connection = hasDatabase ? createDatabaseClient() : undefined;

  afterAll(async () => {
    await connection?.client.end();
  });

  it("connects to the isolated test database", async () => {
    if (!connection) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }

    const result = await connection.client`select 1 as value`;
    expect(result?.[0]?.value).toBe(1);
  });
});
