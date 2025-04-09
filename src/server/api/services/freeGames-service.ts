import { freeGames } from "~/server/db/schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "~/server/db/schema";

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
  release_date: Date;
}

export async function createFreeGame(
  db: PostgresJsDatabase<typeof schema>,
  data: FreeGameCreateInput,
) {
  const freeGame = await db.insert(freeGames).values(data).returning();
  return freeGame;
}



export async function getAvailableFreeGames(db: PostgresJsDatabase<typeof schema>) {
  const freeGames = await db.query.freeGames.findMany({
    where: (freeGames, { lte, gte, and }) =>
      and(lte(freeGames.end_date, new Date()), gte(freeGames.start_date, new Date())),
  });

  return freeGames;
}

