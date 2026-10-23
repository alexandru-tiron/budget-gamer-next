import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import * as schema from "./schema";

// Helpers for integration and end-to-end tests. They delete data, so they only ever talk to a
// local Postgres database.

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "postgres"]);
const MIGRATIONS_FOLDER = fileURLToPath(
  new URL("../../../drizzle", import.meta.url),
);

export type TestDatabase = PostgresJsDatabase<typeof schema>;

/**
 * Throw unless `url` points at a local Postgres server, so a test run can never wipe a real
 * database such as the one in `.env`.
 */
export function assertLocalDatabaseUrl(url: string): void {
  const { hostname } = new URL(url);
  if (!LOCAL_HOSTS.has(hostname)) {
    throw new Error(
      `Refusing to use the database at "${hostname}": tests delete data, so point them at a local Postgres server (localhost).`,
    );
  }
}

/**
 * Connect to a local test database and bring its schema up to date.
 */
export async function openTestDatabase(url: string): Promise<{
  db: TestDatabase;
  close: () => Promise<void>;
}> {
  assertLocalDatabaseUrl(url);
  // Silence "already exists, skipping" notices from the migrator
  const client = postgres(url, { max: 1, onnotice: () => undefined });
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return { db, close: () => client.end() };
}

/**
 * Empty every app table and reset the id sequences.
 */
export async function clearDatabase(db: TestDatabase): Promise<void> {
  await db.execute(
    sql`TRUNCATE ${schema.freeGames}, ${schema.subscriptionGames}, ${schema.articles} RESTART IDENTITY`,
  );
}
