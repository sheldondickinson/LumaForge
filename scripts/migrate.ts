import "dotenv/config";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDatabaseClient } from "@/db/client";

async function main() {
  const { client, db } = createDatabaseClient();

  try {
    await migrate(db, { migrationsFolder: "./db/migrations" });
    console.info("Database migrations completed.");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
