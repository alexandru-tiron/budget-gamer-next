import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { subscriptionGames } from "~/server/db/schema";
import type * as schema from "~/server/db/schema";

export interface SubscriptionGameCreateInput {
  name: string;
  cover: string;
  cover_portrait: string;
  description: string;
  developer: string;
  publisher: string;
  start_date: Date;
  end_date: Date;
  platform_ids: string[];
  provider_id: string;
  provider_url: string;
  release_date: Date;
}

export async function createSubscriptionGame(
  db: NeonHttpDatabase<typeof schema>,
  data: SubscriptionGameCreateInput,
) {
  const subscriptionGame = await db
    .insert(subscriptionGames)
    .values(data)
    .returning();
  return subscriptionGame;
}

export async function getAvailableSubscriptionGames(
  db: NeonHttpDatabase<typeof schema>,
) {
  const subscriptionGames = await db.query.subscriptionGames.findMany({
    where: (subscriptionGames, { lte, gte, and }) =>
      and(
        gte(subscriptionGames.end_date, new Date()),
        lte(subscriptionGames.start_date, new Date()),
      ),
  });

  return subscriptionGames;
}
