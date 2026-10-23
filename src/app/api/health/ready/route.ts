import { sql } from "drizzle-orm";

import { databaseDriver, db } from "~/server/db";
import { logger } from "~/server/logger";

const log = logger.child({ scope: "health" });

// Readiness check: the server can reach the database and should get traffic
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({
      status: "ok",
      database: "ok",
      driver: databaseDriver,
    });
  } catch (error) {
    log.error("Database is unreachable", { error });
    return Response.json(
      { status: "error", database: "unreachable" },
      { status: 503 },
    );
  }
}
