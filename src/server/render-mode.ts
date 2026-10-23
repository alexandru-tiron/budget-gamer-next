import { connection } from "next/server";

import { env } from "~/env";

/**
 * Pages are normally prerendered from the database at build time and then revalidated. Docker
 * images are built without a database, so with BUILD_WITHOUT_DATABASE=1 this opts the page into
 * rendering on each request instead. Call it before the page reads from the database.
 */
export async function renderPerRequestIfBuiltWithoutDatabase(): Promise<void> {
  if (env.BUILD_WITHOUT_DATABASE === "1") {
    await connection();
  }
}
