import { eq } from "drizzle-orm";

import type { db } from "~/server/db";
import { subscriptionGames } from "~/server/db/schema";
import { processPlayStationGame } from "./playstation-helpers";
import {
  findSubscriptionGameByUrl,
  upsertSubscriptionGame,
} from "../services/subscriptionGames-service";
import { decodeHtmlEntities, fetchJson, fetchText } from "./http";
import { logger } from "~/server/logger";

const log = logger.child({ scope: "ps-plus" });

const PS_PLUS_PAGE_URL = "https://www.playstation.com/en-gb/ps-plus/whats-new/";
const MONTHLY_GAMES_SECTION = "cmp-experiencefragment--wn-latest-monthly-games";

const STORE_GRAPHQL_URL = "https://web.np.playstation.com/api/graphql/v1/op";
// The store only runs registered queries; this is the one its search page sends. If Sony changes
// it, search errors out, and the new hash shows up in the store's search requests.
const SEARCH_QUERY_HASH =
  "4df6284f982e57bec70f23c77e2c219dc792eb19af7fb3d3a81767aa3f1958aa";

export interface StoreSearchResult {
  __typename?: string;
  id?: string;
  name?: string;
  storeDisplayClassification?: string | null;
  price?: {
    upsellServiceBranding?: string[] | null;
    upsellText?: string | null;
  } | null;
}

interface StoreSearchResponse {
  data?: {
    universalSearch?: { results?: StoreSearchResult[] | null } | null;
  } | null;
  errors?: { message?: string }[];
}

/**
 * Titles in the "Your latest monthly games" section of the PS Plus "What's new" page.
 */
export function parseMonthlyGameTitles(html: string): string[] {
  const start = html.indexOf(MONTHLY_GAMES_SECTION);
  if (start === -1) return [];

  // The section ends where the next one (game trials, classics...) starts
  const nextSection = /cmp-experiencefragment--wn-(?!latest-monthly-games)/g;
  nextSection.lastIndex = start;
  const end = nextSection.exec(html)?.index ?? html.length;

  return [
    ...html
      .slice(start, end)
      .matchAll(/txt-block-paragraph__title"[^>]*>([^<]+)</g),
  ]
    .map(([, title = ""]) => decodeHtmlEntities(title).trim())
    .filter((title) => title && !title.startsWith("More games"));
}

/**
 * The search result that is this month's game: the one the store labels "Essential", the PS Plus
 * tier monthly games come with, preferring the full game over add-ons and packs.
 */
export function pickMonthlyGame(results: StoreSearchResult[]): string | null {
  const essential = results.filter(
    (result) =>
      result.__typename === "Product" &&
      result.id &&
      result.price?.upsellText === "Essential" &&
      result.price.upsellServiceBranding?.includes("PS_PLUS"),
  );
  const game =
    essential.find(
      (result) => result.storeDisplayClassification === "FULL_GAME",
    ) ?? essential[0];
  return game?.id ?? null;
}

async function searchStore(searchTerm: string): Promise<StoreSearchResult[]> {
  const params = new URLSearchParams({
    operationName: "getSearchResults",
    variables: JSON.stringify({
      searchTerm,
      countryCode: "GB",
      languageCode: "en",
      pageOffset: 0,
      pageSize: 10,
    }),
    extensions: JSON.stringify({
      persistedQuery: { version: 1, sha256Hash: SEARCH_QUERY_HASH },
    }),
  });

  const response = await fetchJson<StoreSearchResponse>(
    `${STORE_GRAPHQL_URL}?${params}`,
    {
      headers: {
        "content-type": "application/json",
        "x-apollo-operation-name": "getSearchResults",
        "x-psn-store-locale-override": "en-GB",
      },
    },
  );

  const results = response.data?.universalSearch?.results;
  if (!results) {
    const message = response.errors?.[0]?.message ?? "no results";
    throw new Error(`PlayStation Store search failed: ${message}`);
  }
  return results;
}

/**
 * Store links for this month's PlayStation Plus games
 */
export async function fetchPSPlusGames(): Promise<string[]> {
  const titles = parseMonthlyGameTitles(await fetchText(PS_PLUS_PAGE_URL));
  if (titles.length === 0) {
    throw new Error("No monthly games found on the PS Plus page");
  }
  log.info("Found PS Plus game titles", { titles });

  const gameUrls = new Set<string>();
  for (const title of titles) {
    const gameId = pickMonthlyGame(await searchStore(title));
    if (gameId) {
      gameUrls.add(`https://store.playstation.com/en-gb/product/${gameId}`);
    } else {
      log.warn("No PS Plus Essential result for monthly game", { title });
    }
  }

  return [...gameUrls];
}

/**
 * Process PlayStation Plus games and add them to the database
 */
export async function processPSPlusGames(dbInstance: typeof db): Promise<{
  total: number;
  added: number;
  updated: number;
  failed: number;
  errors: string[];
}> {
  try {
    // Fetch PS Plus game URLs
    const gameUrls = await fetchPSPlusGames();

    // Track results
    const results = {
      total: gameUrls.length,
      added: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Calculate start date (1st of the current month)
    const startDate = new Date();
    startDate.setDate(1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    // Process each game URL
    for (const url of gameUrls) {
      try {
        // A game we already know only needs its dates refreshed for this month
        const existingGame = await findSubscriptionGameByUrl(
          dbInstance,
          "playstation",
          url,
        );

        if (existingGame) {
          await dbInstance
            .update(subscriptionGames)
            .set({ start_date: startDate, end_date: endDate })
            .where(eq(subscriptionGames.id, existingGame.id));
          results.updated++;
          continue;
        }

        // Process the game using the existing PlayStation helper
        const result = await processPlayStationGame(url);
        if (!result) {
          throw new Error("Could not read game details");
        }

        const { free: _free, ...gameDetails } = result.gameDetails;
        await upsertSubscriptionGame(dbInstance, {
          ...gameDetails,
          start_date: startDate,
          end_date: endDate,
          provider_id: "playstation",
          provider_url: url,
        });
        results.added++;
      } catch (error) {
        results.failed++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`${url}: ${errorMessage}`);
      }
    }

    return results;
  } catch (error) {
    log.error("Error processing PS Plus games", { error });
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to process PS Plus games: ${errorMessage}`);
  }
}
