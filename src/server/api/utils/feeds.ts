import type { Database } from "~/server/db/drivers";
import {
  findSubscriptionGameByUrl,
  upsertSubscriptionGame,
  type SubscriptionGameCreateInput,
} from "../services/subscriptionGames-service";

// Shared by the Xbox and Nintendo feeds

export const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Listings without an end date (Game Pass additions, Game Trials) stay up this long after their
 * source last showed them. The daily cron refreshes them, so they drop off within two days of
 * leaving the source.
 */
export const ROLLING_LISTING_MS = 2 * DAY_MS;

export interface FeedResult {
  total: number;
  added: number;
  updated: number;
  failed: number;
  errors: string[];
}

export function emptyFeedResult(total = 0): FeedResult {
  return { total, added: 0, updated: 0, failed: 0, errors: [] };
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Upsert a subscription listing, keeping the date it first appeared.
 */
export async function upsertListing(
  db: Database,
  data: Omit<SubscriptionGameCreateInput, "start_date">,
  firstSeen: Date,
): Promise<"added" | "updated"> {
  const existing = await findSubscriptionGameByUrl(
    db,
    data.provider_id,
    data.provider_url,
  );
  return upsertSubscriptionGame(db, {
    ...data,
    start_date: existing?.start_date ?? firstSeen,
  });
}
