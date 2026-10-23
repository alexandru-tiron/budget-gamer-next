import type { Database } from "~/server/db/drivers";
import { logger } from "~/server/logger";
import { upsertFreeGame } from "../services/freeGames-service";
import {
  DAY_MS,
  emptyFeedResult,
  errorMessage,
  ROLLING_LISTING_MS,
  upsertListing,
  type FeedResult,
} from "./feeds";
import { fetchJson, fetchText } from "./http";
import { monthIndex, PACIFIC_TIME_ZONE, zonedTimeToUtc } from "./time";
import {
  extractXboxProductId,
  fetchCatalogProducts,
  findFreeToKeepOffer,
  parseXboxProduct,
  XBOX_LANGUAGE,
  XBOX_MARKET,
  type XboxProduct,
} from "./xbox-helpers";

const log = logger.child({ scope: "xbox-feeds" });

// Game Pass' public "Recently added" list
const GAME_PASS_RECENTLY_ADDED = "f13cf6b4-57e6-4459-89df-6aec18cf0538";
const XBOX_WIRE = "https://news.xbox.com/en-us";
// Microsoft's subscription products (Game Pass Ultimate, PC Game Pass...) share this prefix
const SUBSCRIPTION_PRODUCT_PREFIX = "CFQ7TTC0";
// Xbox Wire posts older than this are ignored when looking for giveaways
const GIVEAWAY_POST_MAX_AGE_MS = 30 * DAY_MS;

function listingFields(game: XboxProduct) {
  return {
    name: game.name,
    cover: game.cover,
    cover_portrait: game.coverPortrait,
    description: game.description,
    developer: game.developer,
    publisher: game.publisher,
    platform_ids: game.platformIds,
    provider_url: game.storeUrl,
    release_date: game.releaseDate,
  };
}

// ---- Game Pass ----------------------------------------------------------------------------------

/**
 * The Game Pass list API returns a header object followed by `{ id }` entries.
 */
export function parseGamePassList(data: unknown): string[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((entry: unknown) =>
    typeof entry === "object" &&
    entry !== null &&
    "id" in entry &&
    typeof entry.id === "string"
      ? [entry.id]
      : [],
  );
}

export async function fetchGamePassRecentlyAdded(): Promise<string[]> {
  const data = await fetchJson<unknown>(
    `https://catalog.gamepass.com/sigls/v2?id=${GAME_PASS_RECENTLY_ADDED}&language=${XBOX_LANGUAGE}&market=${XBOX_MARKET}`,
  );
  return parseGamePassList(data);
}

/**
 * List the games Game Pass added recently, for as long as Microsoft lists them as recent.
 */
export async function processGamePassAdditions(
  db: Database,
): Promise<FeedResult> {
  const products = await fetchCatalogProducts(
    await fetchGamePassRecentlyAdded(),
  );
  const now = new Date();
  const result = emptyFeedResult(products.length);

  for (const product of products) {
    const game = parseXboxProduct(product);
    try {
      const outcome = await upsertListing(
        db,
        {
          ...listingFields(game),
          provider_id: "xbox_game_pass",
          end_date: new Date(now.getTime() + ROLLING_LISTING_MS),
        },
        now,
      );
      result[outcome]++;
    } catch (error) {
      result.failed++;
      result.errors.push(`${game.name}: ${errorMessage(error)}`);
    }
  }

  return result;
}

// ---- Free Play Days -----------------------------------------------------------------------------

export interface FreePlayDaysGame {
  productId: string;
  /** null when the post doesn't say */
  membershipRequired: boolean | null;
}

export interface FreePlayDaysPost {
  startDate: Date;
  endDate: Date;
  games: FreePlayDaysGame[];
}

/**
 * Newest Free Play Days post linked from the Xbox Wire tag page. The URLs start with the date,
 * so they sort chronologically.
 */
export function findLatestFreePlayDaysPost(tagHtml: string): string | null {
  const urls = tagHtml.match(
    /https:\/\/news\.xbox\.com\/en-us\/\d{4}\/\d{2}\/\d{2}\/free-play-days[^"'\s<>]*/g,
  );
  return urls ? ([...new Set(urls)].sort().at(-1) ?? null) : null;
}

/**
 * Xbox store product ids linked from some HTML, skipping Game Pass and other subscriptions.
 */
export function extractStoreProductIds(html: string): string[] {
  const ids = (
    html.match(
      /https:\/\/www\.xbox\.com\/[a-z]{2}-[a-z]{2}\/games\/store\/[^"'\s<>?#]+/gi,
    ) ?? []
  )
    .map((link) => extractXboxProductId(link))
    .filter((id): id is string => id !== null)
    .filter((id) => !id.startsWith(SUBSCRIPTION_PRODUCT_PREFIX));
  return [...new Set(ids)];
}

function toText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Midnight-to-midnight dates in a Free Play Days post, e.g. "from Thursday, October 15 until
 * Sunday, October 18", in Pacific time. The year comes from the publish date.
 */
function findPostDates(
  text: string,
  published: Date,
): { start: number | null; end: number | null } {
  const pattern = (word: string) =>
    new RegExp(
      `\\b${word}\\s+(?:\\p{L}+day\\s*,?\\s*)?(\\p{L}+)\\s+(\\d{1,2})\\b`,
      "giu",
    );
  const toTime = (month: string, day: string, endOfDay: boolean) => {
    const index = monthIndex(month);
    if (index === -1) return null;
    let year = published.getUTCFullYear();
    // A post from late December can end in January
    if (index < published.getUTCMonth() - 6) year++;
    return zonedTimeToUtc(
      year,
      index,
      Number(day),
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      PACIFIC_TIME_ZONE,
    );
  };

  const starts = [...text.matchAll(pattern("from"))]
    .map((match) => toTime(match[1] ?? "", match[2] ?? "", false))
    .filter((time): time is number => time !== null);
  const ends = [...text.matchAll(pattern("until"))]
    .map((match) => toTime(match[1] ?? "", match[2] ?? "", true))
    .filter((time): time is number => time !== null);

  return {
    start: starts.length > 0 ? Math.min(...starts) : null,
    end: ends.length > 0 ? Math.max(...ends) : null,
  };
}

/**
 * Sunday 23:59 Pacific time of the weekend after `published`.
 */
function followingSundayNight(published: Date): number {
  const daysToSunday = (7 - published.getUTCDay()) % 7;
  const sunday = new Date(published.getTime() + daysToSunday * DAY_MS);
  return zonedTimeToUtc(
    sunday.getUTCFullYear(),
    sunday.getUTCMonth(),
    sunday.getUTCDate(),
    23,
    59,
    PACIFIC_TIME_ZONE,
  );
}

/**
 * Read the games and dates out of an Xbox Wire Free Play Days post. Games are linked under
 * "Free Play Days (Game Pass Membership Required)" and "Free Play Days For All" headings.
 */
export function parseFreePlayDaysPost(
  html: string,
  now: Date = new Date(),
): FreePlayDaysPost {
  const published = /"datePublished":"([^"]+)"/.exec(html)?.[1];
  const publishedAt = published ? new Date(published) : now;

  const articleStart = html.indexOf("<article");
  const articleEnd = html.lastIndexOf("</article>");
  const article =
    articleStart !== -1 && articleEnd > articleStart
      ? html.slice(articleStart, articleEnd)
      : html;

  // Section headings, in order, with the access rule they announce
  const sections = [...article.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)]
    .map((match) => {
      const heading = toText(match[1] ?? "").toLowerCase();
      if (!heading.includes("free play days")) return null;
      return {
        index: match.index,
        membershipRequired: heading.includes("membership required")
          ? true
          : heading.includes("for all")
            ? false
            : null,
      };
    })
    .filter((section) => section !== null);

  const games = new Map<string, FreePlayDaysGame>();
  for (const match of article.matchAll(
    /https:\/\/www\.xbox\.com\/[a-z]{2}-[a-z]{2}\/games\/store\/[^"'\s<>?#]+/gi,
  )) {
    const productId = extractXboxProductId(match[0]);
    if (!productId || productId.startsWith(SUBSCRIPTION_PRODUCT_PREFIX)) {
      continue;
    }
    const section = sections.filter((s) => s.index < match.index).at(-1);
    // With section headings, links before the first one are promos, not this weekend's games
    if (sections.length > 0 && !section) continue;
    if (!games.has(productId)) {
      games.set(productId, {
        productId,
        membershipRequired: section?.membershipRequired ?? null,
      });
    }
  }

  const dates = findPostDates(toText(article), publishedAt);
  return {
    startDate: new Date(dates.start ?? publishedAt.getTime()),
    endDate: new Date(dates.end ?? followingSundayNight(publishedAt)),
    games: [...games.values()],
  };
}

const FREE_PLAY_DAYS_NOTES: Record<string, string> = {
  true: "Free to play this weekend with a Game Pass membership.",
  false: "Free to play this weekend for all Xbox players.",
  null: "Free to play this weekend.",
};

/**
 * List this weekend's Free Play Days games until the weekend ends.
 */
export async function processFreePlayDays(db: Database): Promise<FeedResult> {
  const tagHtml = await fetchText(`${XBOX_WIRE}/tag/free-play-days/`);
  const postUrl = findLatestFreePlayDaysPost(tagHtml);
  if (!postUrl) throw new Error("No Free Play Days post found on Xbox Wire");

  const post = parseFreePlayDaysPost(await fetchText(postUrl));
  if (post.endDate.getTime() < Date.now()) {
    log.info("The latest Free Play Days weekend is over", { postUrl });
    return emptyFeedResult();
  }

  const access = new Map(
    post.games.map((game) => [game.productId, game.membershipRequired]),
  );
  const products = await fetchCatalogProducts([...access.keys()]);
  const result = emptyFeedResult(products.length);

  for (const product of products) {
    const game = parseXboxProduct(product);
    const note =
      FREE_PLAY_DAYS_NOTES[String(access.get(game.productId) ?? null)];
    try {
      const outcome = await upsertListing(
        db,
        {
          ...listingFields(game),
          description: [note, game.description].filter(Boolean).join(" "),
          provider_id: "xbox_free_play_days",
          end_date: post.endDate,
        },
        post.startDate,
      );
      result[outcome]++;
    } catch (error) {
      result.failed++;
      result.errors.push(`${game.name}: ${errorMessage(error)}`);
    }
  }

  return result;
}

// ---- Free-to-keep giveaways ---------------------------------------------------------------------

/**
 * Xbox Wire posts that mention "free to keep" (newest first, last 30 days), plus the latest
 * Free Play Days post, which sometimes includes a giveaway.
 */
async function fetchGiveawayPostUrls(now: Date): Promise<string[]> {
  const searchHtml = await fetchText(`${XBOX_WIRE}/?s=%22free+to+keep%22`);
  const recent = [
    ...new Set(
      searchHtml.match(
        /https:\/\/news\.xbox\.com\/en-us\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+\//g,
      ) ?? [],
    ),
  ].filter((url) => {
    const date = /\/(\d{4})\/(\d{2})\/(\d{2})\//.exec(url);
    if (!date) return false;
    const posted = Date.UTC(
      Number(date[1]),
      Number(date[2]) - 1,
      Number(date[3]),
    );
    return now.getTime() - posted <= GIVEAWAY_POST_MAX_AGE_MS;
  });

  const freePlayDays = findLatestFreePlayDaysPost(
    await fetchText(`${XBOX_WIRE}/tag/free-play-days/`),
  );
  return [...new Set([...recent, ...(freePlayDays ? [freePlayDays] : [])])];
}

/**
 * A store product with its free-to-keep offer, or null if it isn't in the catalog.
 */
export async function fetchXboxGiveaway(productId: string): Promise<{
  game: XboxProduct;
  offer: { endDate: Date | null } | null;
} | null> {
  const [product] = await fetchCatalogProducts([productId]);
  if (!product) return null;
  return {
    game: parseXboxProduct(product),
    offer: findFreeToKeepOffer(product),
  };
}

/**
 * Check every store link in recent Xbox Wire posts and list the ones that are free to keep.
 */
export async function processXboxGiveaways(db: Database): Promise<FeedResult> {
  const now = new Date();
  const productIds = new Set<string>();
  for (const url of await fetchGiveawayPostUrls(now)) {
    try {
      for (const id of extractStoreProductIds(await fetchText(url))) {
        productIds.add(id);
      }
    } catch (error) {
      log.warn("Couldn't read Xbox Wire post", { url, error });
    }
  }

  const products = await fetchCatalogProducts([...productIds]);
  const giveaways = products.flatMap((product) => {
    const offer = findFreeToKeepOffer(product);
    return offer ? [{ game: parseXboxProduct(product), offer }] : [];
  });
  const result = emptyFeedResult(giveaways.length);

  for (const { game, offer } of giveaways) {
    try {
      const outcome = await upsertFreeGame(db, {
        ...listingFields(game),
        free: true,
        start_date: now,
        // The catalog normally has the end date; fall back to a few days
        end_date: offer.endDate ?? new Date(now.getTime() + 4 * DAY_MS),
        provider_id: "xbox",
      });
      result[outcome]++;
    } catch (error) {
      result.failed++;
      result.errors.push(`${game.name}: ${errorMessage(error)}`);
    }
  }

  log.info("Checked Xbox Wire store links for giveaways", {
    checked: productIds.size,
    giveaways: giveaways.length,
  });
  return result;
}
