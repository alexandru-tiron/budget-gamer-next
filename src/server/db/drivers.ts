import { neon } from "@neondatabase/serverless";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/**
 * - `neon-http`: Neon's serverless HTTP driver, one request per query (Vercel / Neon)
 * - `postgres`: a regular TCP connection pool, for local Postgres, Docker or self-hosting
 */
export type DatabaseDriver = "neon-http" | "postgres";

/** A Drizzle database on either driver. */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

export interface DatabaseConnection {
  db: Database;
  driver: DatabaseDriver;
  /** Close open connections (a no-op for the HTTP driver). */
  close: () => Promise<void>;
}

/**
 * Pick the driver for a connection string: Neon hosts use the HTTP driver, anything else a
 * regular Postgres connection. `override` (from DATABASE_DRIVER) wins when set.
 */
export function resolveDatabaseDriver(
  url: string,
  override?: DatabaseDriver,
): DatabaseDriver {
  if (override) return override;
  const { hostname } = new URL(url);
  return hostname === "neon.tech" || hostname.endsWith(".neon.tech")
    ? "neon-http"
    : "postgres";
}

export function connectDatabase(
  url: string,
  driver: DatabaseDriver,
): DatabaseConnection {
  if (driver === "neon-http") {
    return {
      db: drizzleNeonHttp({ schema, client: neon(url) }),
      driver,
      close: async () => undefined,
    };
  }

  // Idle connections close after 20s, so scripts and build workers can exit
  const client = postgres(url, { max: 10, idle_timeout: 20 });
  return {
    db: drizzlePostgres({ schema, client }),
    driver,
    close: () => client.end(),
  };
}
