import { env } from "~/env";
import {
  connectDatabase,
  resolveDatabaseDriver,
  type DatabaseConnection,
} from "./drivers";

export type { Database, DatabaseDriver } from "./drivers";

/**
 * Cache the database connection in development. This avoids creating a new connection pool on
 * every HMR update.
 */
const globalForDb = globalThis as unknown as {
  connection: DatabaseConnection | undefined;
};

const connection =
  globalForDb.connection ??
  connectDatabase(
    env.DATABASE_URL,
    resolveDatabaseDriver(env.DATABASE_URL, env.DATABASE_DRIVER),
  );
if (env.NODE_ENV !== "production") globalForDb.connection = connection;

export const db = connection.db;
export const databaseDriver = connection.driver;
