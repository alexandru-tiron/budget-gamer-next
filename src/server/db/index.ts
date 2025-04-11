/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

import { env } from "~/env";
import * as schema from "./schema";
// import ws from "ws";
// neonConfig.webSocketConstructor = ws;
/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
// const globalForDb = globalThis as unknown as {
//   conn: neon.NeonClient | undefined;
// };

// const conn = globalForDb.conn ?? neon(env.DATABASE_URL);
// if (env.NODE_ENV !== "production") globalForDb.conn = conn;

// Create database connection
const sql = neon(env.DATABASE_URL);

export const db = drizzle({ schema, client: sql });
