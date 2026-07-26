import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const client = postgres(databaseUrl, {
  max: 1,
  connect_timeout: 10,
});

try {
  await migrate(drizzle(client), { migrationsFolder: "/app/db/migrations" });
  console.info("Database migrations completed.");
} finally {
  await client.end();
}
