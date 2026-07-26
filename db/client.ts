import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnvironment } from "@/lib/env";

type DatabaseHealth =
  { status: "ok" } | { status: "error"; message: "Database connection failed" };

export function createDatabaseClient() {
  const { DATABASE_URL } = getServerEnvironment();
  const client = postgres(DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return {
    client,
    db: drizzle(client),
  };
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  let connection: ReturnType<typeof createDatabaseClient> | undefined;

  try {
    connection = createDatabaseClient();
    await connection.client`select 1`;
    return { status: "ok" };
  } catch {
    return {
      status: "error",
      message: "Database connection failed",
    };
  } finally {
    await connection?.client.end();
  }
}
