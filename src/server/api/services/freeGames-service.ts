import { eq } from "drizzle-orm";
import type { Database } from "~/server/db/drivers";
import { freeGames } from "~/server/db/schema";

export interface FreeGameCreateInput {
  name: string;
  cover: string;
  cover_portrait: string;
  description: string;
  developer: string;
  publisher: string;
  start_date: Date;
  end_date: Date;
  free: boolean;
  platform_ids: string[];
  provider_id: string;
  provider_url: string;
  release_date: Date | null;
}

export async function createFreeGame(db: Database, data: FreeGameCreateInput) {
  const freeGame = await db.insert(freeGames).values(data).returning();
  return freeGame;
}

export async function findFreeGameByUrl(db: Database, providerUrl: string) {
  return db.query.freeGames.findFirst({
    where: eq(freeGames.provider_url, providerUrl),
  });
}

/**
 * Insert a game, or refresh the existing row with the same store URL so a game that comes back
 * for a new promotion shows up again.
 */
export async function upsertFreeGame(
  db: Database,
  data: FreeGameCreateInput,
): Promise<"added" | "updated"> {
  const existingGame = await findFreeGameByUrl(db, data.provider_url);

  if (existingGame) {
    await db
      .update(freeGames)
      .set(data)
      .where(eq(freeGames.id, existingGame.id));
    return "updated";
  }

  await db.insert(freeGames).values(data);
  return "added";
}

/**
 * Get available games (current date is between start_date and end_date)
 */
export async function getAvailableFreeGames(db: Database) {
  const freeGames = await db.query.freeGames.findMany({
    where: (freeGames, { lte, gte, and }) =>
      and(
        gte(freeGames.end_date, new Date()),
        lte(freeGames.start_date, new Date()),
      ),
    orderBy: (freeGames, { asc }) => [asc(freeGames.end_date)],
  });

  return freeGames;
}
