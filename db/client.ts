import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnvironment } from "@/lib/env";

type DatabaseHealth =
  { status: "ok" } | { status: "error"; message: "Database connection failed" };

export type DatabaseConnection = ReturnType<typeof createDatabaseClient>;

export function createDatabaseClient(options?: { max?: number }) {
  const { DATABASE_URL } = getServerEnvironment();
  const client = postgres(DATABASE_URL, {
    max: options?.max ?? 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return {
    client,
    db: drizzle(client),
  };
}

const globalDatabase = globalThis as typeof globalThis & {
  lumaforgeDatabase?: DatabaseConnection;
};

export function getDatabaseConnection() {
  if (!globalDatabase.lumaforgeDatabase) {
    globalDatabase.lumaforgeDatabase = createDatabaseClient();
  }

  return globalDatabase.lumaforgeDatabase;
}

export async function closeDatabaseConnection() {
  await globalDatabase.lumaforgeDatabase?.client.end();
  globalDatabase.lumaforgeDatabase = undefined;
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  try {
    const connection = getDatabaseConnection();
    await connection.client`select 1`;
    return { status: "ok" };
  } catch {
    return {
      status: "error",
      message: "Database connection failed",
    };
  }
}
