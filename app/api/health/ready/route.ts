import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = await checkDatabaseHealth();
  const ready = database.status === "ok";

  return NextResponse.json(
    {
      status: ready ? "ok" : "unavailable",
      checks: {
        database,
      },
    },
    {
      status: ready ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
