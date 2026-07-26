import "dotenv/config";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDatabaseClient } from "@/db/client";

const { client, db } = createDatabaseClient();

try {
  await migrate(db, { migrationsFolder: "./db/migrations" });
  console.info("Database migrations completed.");
} finally {
  await client.end();
}
