import { and, eq } from "drizzle-orm";
import { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type { Database } from "~/server/db/drivers";
import { subscriptionGames } from "~/server/db/schema";

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
  release_date: Date | null;
}

export async function createSubscriptionGame(
  db: Database,
  data: SubscriptionGameCreateInput,
) {
  const subscriptionGame = await db
    .insert(subscriptionGames)
    .values(data)
    .returning();
  return subscriptionGame;
}

/**
 * Find a service's entry for a store URL. The same game can be listed by several services.
 */
export async function findSubscriptionGameByUrl(
  db: Database,
  providerId: string,
  providerUrl: string,
) {
  return db.query.subscriptionGames.findFirst({
    where: and(
      eq(subscriptionGames.provider_id, providerId),
      eq(subscriptionGames.provider_url, providerUrl),
    ),
  });
}

/**
 * Insert a game, or refresh the service's existing row for the same store URL so a game that
 * returns to a subscription in a later month shows up again.
 */
export async function upsertSubscriptionGame(
  db: Database,
  data: SubscriptionGameCreateInput,
): Promise<"added" | "updated"> {
  const existingGame = await findSubscriptionGameByUrl(
    db,
    data.provider_id,
    data.provider_url,
  );

  if (existingGame) {
    await db
      .update(subscriptionGames)
      .set(data)
      .where(eq(subscriptionGames.id, existingGame.id));
    return "updated";
  }

  await db.insert(subscriptionGames).values(data);
  return "added";
}

/**
 * Swap every game from `providerId` for `games` atomically, so a failed insert never leaves the
 * provider's list empty.
 */
export async function replaceSubscriptionGames(
  db: Database,
  providerId: string,
  games: SubscriptionGameCreateInput[],
): Promise<void> {
  const byProvider = eq(subscriptionGames.provider_id, providerId);

  // The Neon HTTP driver can't hold a transaction open, but runs a batch as one transaction
  if (db instanceof NeonHttpDatabase) {
    if (games.length === 0) {
      await db.delete(subscriptionGames).where(byProvider);
      return;
    }
    await db.batch([
      db.delete(subscriptionGames).where(byProvider),
      db.insert(subscriptionGames).values(games),
    ]);
    return;
  }

  await db.transaction(async (tx) => {
    await tx.delete(subscriptionGames).where(byProvider);
    if (games.length > 0) {
      await tx.insert(subscriptionGames).values(games);
    }
  });
}

/**
 * Get available games (current date is between start_date and end_date)
 */
export async function getAvailableSubscriptionGames(db: Database) {
  const subscriptionGames = await db.query.subscriptionGames.findMany({
    where: (subscriptionGames, { lte, gte, and }) =>
      and(
        gte(subscriptionGames.end_date, new Date()),
        lte(subscriptionGames.start_date, new Date()),
      ),
  });

  return subscriptionGames;
}
