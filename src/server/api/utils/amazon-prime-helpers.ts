import type { db } from "~/server/db";
import { upsertSubscriptionGame } from "../services/subscriptionGames-service";
import { fetchJson, fetchOk } from "./http";
import { logger } from "~/server/logger";

const log = logger.child({ scope: "amazon-prime" });

// Prime Gaming moved into Amazon Luna. Its claims page loads the free games from this GraphQL API,
// which accepts plain requests once they carry the page's CSRF token and session cookies.
const LUNA_CLAIMS_URL = "https://luna.amazon.com/claims/home";
const LUNA_GRAPHQL_URL = "https://luna.amazon.com/graphql";

// Without a page size the API only returns the first 12 games
const PAGE_SIZE = 100;

const FREE_GAMES_QUERY = `query FreeGames($collectionType: ItemCollectionType, $pageSize: Int) {
  items(collectionType: $collectionType, pageSize: $pageSize) {
    items {
      category
      assets {
        title
        shortformDescription
        externalClaimLink
        cardMedia { defaultMedia { src2x } }
      }
      offers { startTime endTime }
      game {
        assets {
          publisher
          primaryDeveloper
          releaseDate
          longformDescription
          heroMedia { defaultMedia { src2x } }
        }
      }
    }
  }
}`;

interface LunaMedia {
  defaultMedia?: { src2x?: string | null } | null;
}

export interface LunaItem {
  category?: string | null;
  assets?: {
    title?: string | null;
    shortformDescription?: string | null;
    externalClaimLink?: string | null;
    cardMedia?: LunaMedia | null;
  } | null;
  offers?: { startTime?: string | null; endTime?: string | null }[] | null;
  game?: {
    assets?: {
      publisher?: string | null;
      primaryDeveloper?: string | null;
      releaseDate?: string | null;
      longformDescription?: string | null;
      heroMedia?: LunaMedia | null;
    } | null;
  } | null;
}

interface LunaResponse {
  data?: { items?: { items?: LunaItem[] | null } | null } | null;
  errors?: { message?: string }[];
}

export interface PrimeGamingGame {
  name: string;
  cover: string;
  cover_portrait: string;
  description: string;
  developer: string;
  publisher: string;
  release_date: Date | null;
  start_date: Date;
  end_date: Date;
  provider_url: string;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Luna leaves many fields empty or null, so take the first one that is filled in
function firstFilled(...values: (string | null | undefined)[]): string {
  return values.map((value) => value?.trim()).find(Boolean) ?? "";
}

/**
 * Turn Luna's free game items into games, skipping in-game loot, incomplete items and offers
 * that already ended.
 */
export function parseLunaItems(
  items: LunaItem[],
  now: Date = new Date(),
): PrimeGamingGame[] {
  const games: PrimeGamingGame[] = [];

  for (const item of items) {
    const name = item.assets?.title?.trim();
    const claimLink = item.assets?.externalClaimLink;
    const offer = item.offers?.[0];
    const endDate = parseDate(offer?.endTime);
    if (item.category !== "FULL_GAME" || !name || !claimLink || !endDate) {
      continue;
    }
    if (endDate <= now || !URL.canParse(claimLink)) continue;

    // Claim links carry tracking parameters; the path alone identifies the game
    const url = new URL(claimLink);
    const providerUrl = `${url.origin}${url.pathname}`;

    const gameAssets = item.game?.assets;
    const card = item.assets?.cardMedia?.defaultMedia?.src2x;
    const hero = gameAssets?.heroMedia?.defaultMedia?.src2x;
    const publisher = firstFilled(gameAssets?.publisher);

    games.push({
      name,
      cover: firstFilled(hero, card),
      cover_portrait: firstFilled(card, hero),
      description: firstFilled(
        gameAssets?.longformDescription,
        item.assets?.shortformDescription,
      ),
      developer: firstFilled(gameAssets?.primaryDeveloper, publisher),
      publisher,
      release_date: parseDate(gameAssets?.releaseDate),
      start_date: parseDate(offer?.startTime) ?? now,
      end_date: endDate,
      provider_url: providerUrl,
    });
  }

  return games;
}

/**
 * Fetch this month's Prime Gaming free games from Amazon Luna.
 */
export async function fetchPrimeGamingGames(): Promise<PrimeGamingGame[]> {
  const page = await fetchOk(LUNA_CLAIMS_URL, {
    headers: { "accept-language": "en-GB,en;q=0.9" },
  });
  const html = await page.text();
  const csrfToken = /name=['"]csrf-key['"]\s+value=['"]([^'"]+)['"]/.exec(
    html,
  )?.[1];
  if (!csrfToken) {
    throw new Error("Amazon Luna claims page has no CSRF token");
  }
  const cookie = page.headers
    .getSetCookie()
    .map((header) => header.split(";")[0])
    .join("; ");

  const response = await fetchJson<LunaResponse>(LUNA_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "csrf-token": csrfToken,
      cookie,
      origin: "https://luna.amazon.com",
      referer: LUNA_CLAIMS_URL,
    },
    body: JSON.stringify({
      operationName: "FreeGames",
      query: FREE_GAMES_QUERY,
      variables: { collectionType: "FREE_GAMES", pageSize: PAGE_SIZE },
    }),
  });

  if (response.errors?.length) {
    const messages = response.errors.map((error) => error.message).join("; ");
    throw new Error(`Amazon Luna API error: ${messages}`);
  }

  const games = parseLunaItems(response.data?.items?.items ?? []);
  log.info("Fetched Prime Gaming games", { games: games.length });
  return games;
}

/**
 * Process Amazon Prime games and add them to the database
 */
export async function processAmazonPrimeGames(dbInstance: typeof db): Promise<{
  total: number;
  added: number;
  updated: number;
  failed: number;
  errors: string[];
}> {
  try {
    const primeGames = await fetchPrimeGamingGames();

    // Track results
    const results = {
      total: primeGames.length,
      added: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each game
    for (const game of primeGames) {
      try {
        const outcome = await upsertSubscriptionGame(dbInstance, {
          ...game,
          // Prime Gaming games are PC games claimed on Epic, GOG, Amazon or Legacy Games
          platform_ids: ["windows"],
          provider_id: "amazon_games",
        });

        results[outcome]++;
      } catch (error) {
        results.failed++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`${game.name}: ${errorMessage}`);
      }
    }

    return results;
  } catch (error) {
    log.error("Error processing Amazon Prime games", { error });
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to process Amazon Prime games: ${errorMessage}`);
  }
}
