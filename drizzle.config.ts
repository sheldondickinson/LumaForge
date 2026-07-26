import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://lumaforge:lumaforge@localhost:5432/lumaforge",
  },
  strict: true,
  verbose: true,
});
