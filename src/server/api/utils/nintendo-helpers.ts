import type { Database } from "~/server/db/drivers";
import { logger } from "~/server/logger";
import {
  emptyFeedResult,
  errorMessage,
  ROLLING_LISTING_MS,
  upsertListing,
  type FeedResult,
} from "./feeds";
import { fetchJson, fetchText } from "./http";

const log = logger.child({ scope: "nintendo" });

// Nintendo of Europe: English pages, prices for Ireland (EUR). Game ids are shared across Europe.
export const NINTENDO_COUNTRY = "IE";
const NINTENDO_SITE = "https://www.nintendo.com";
const SEARCH_URL = "https://searching.nintendo-europe.com/en/select";
const PRICE_URL = "https://api.ec.nintendo.com/v1/price";
const GAME_TRIALS_PAGE = `${NINTENDO_SITE}/en-gb/Nintendo-Switch-Online/What-s-included-/Exclusive-offers-for-members/Exclusive-offers-for-members-1437882.html`;

// Nintendo of Europe's search index, reduced to the fields we read
export interface NintendoSearchDoc {
  fs_id?: string;
  title?: string;
  url?: string;
  nsuid_txt?: string[];
  excerpt?: string;
  publisher?: string;
  developer?: string;
  image_url?: string;
  image_url_h2x1_s?: string;
  dates_released_dts?: string[];
  system_names_txt?: string[];
}

export interface NintendoGame {
  id: string;
  name: string;
  nsuids: string[];
  url: string;
  description: string;
  developer: string;
  publisher: string;
  cover: string;
  coverPortrait: string;
  platformIds: string[];
  releaseDate: Date | null;
}

interface NintendoPriceValue {
  raw_value?: string;
  start_datetime?: string;
  end_datetime?: string;
}

export interface NintendoPrice {
  title_id?: number;
  sales_status?: string;
  regular_price?: NintendoPriceValue;
  discount_price?: NintendoPriceValue;
}

/**
 * Get the page id from a Nintendo of Europe page, e.g.
 * https://www.nintendo.com/en-gb/Games/Nintendo-Switch-games/Some-Game-1438623.html
 * The section name depends on the language ("Games", "Spiele"...), so any section is accepted;
 * ids are looked up in the English (en-gb) index.
 */
export function extractNintendoGameId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!/(^|\.)nintendo\.com$/i.test(parsed.hostname)) return null;
  return (
    /^\/[a-z]{2}-[a-z]{2}\/(?:[^/]+\/)+[^/]+-(\d+)\.html$/i.exec(
      parsed.pathname,
    )?.[1] ?? null
  );
}

const PLATFORMS: Record<string, string> = {
  "Nintendo Switch 2": "nintendo_switch_2",
  "Nintendo Switch": "nintendo_switch",
};

export function parseNintendoGame(doc: NintendoSearchDoc): NintendoGame {
  const released = doc.dates_released_dts?.[0];
  const releaseDate = released ? new Date(released) : null;
  const platformIds = [
    ...new Set(
      (doc.system_names_txt ?? []).flatMap((name) => {
        const id = PLATFORMS[name.trim()];
        return id ? [id] : [];
      }),
    ),
  ];

  return {
    id: doc.fs_id ?? "",
    name: doc.title?.trim() ?? "",
    nsuids: doc.nsuid_txt ?? [],
    url: doc.url ? `${NINTENDO_SITE}${doc.url}` : "",
    description: doc.excerpt?.trim() ?? "",
    developer: (doc.developer ?? doc.publisher ?? "").trim(),
    publisher: doc.publisher?.trim() ?? "",
    cover: doc.image_url_h2x1_s ?? doc.image_url ?? "",
    coverPortrait: doc.image_url ?? doc.image_url_h2x1_s ?? "",
    platformIds: platformIds.length > 0 ? platformIds : ["nintendo_switch"],
    releaseDate:
      releaseDate && !Number.isNaN(releaseDate.getTime()) ? releaseDate : null,
  };
}

/**
 * Look a game up in Nintendo of Europe's search index by its page id.
 */
export async function fetchNintendoGame(
  gameId: string,
): Promise<NintendoGame | null> {
  if (!/^\d+$/.test(gameId)) return null;
  const params = new URLSearchParams({
    q: "*",
    fq: `type:GAME AND fs_id:${gameId}`,
    rows: "1",
    wt: "json",
  });
  const data = await fetchJson<{ response?: { docs?: NintendoSearchDoc[] } }>(
    `${SEARCH_URL}?${params.toString()}`,
  );
  const doc = data.response?.docs?.[0];
  return doc ? parseNintendoGame(doc) : null;
}

const toAmount = (value?: NintendoPriceValue) =>
  value?.raw_value === undefined ? null : Number(value.raw_value);

/**
 * A free-to-keep offer: the sale price is 0 while the regular price is above 0. Free-to-start
 * games (regular price 0) and demos don't count. Returns when the sale ends, or null.
 */
export function findFreeToKeepPrice(
  prices: NintendoPrice[],
): { endDate: Date | null } | null {
  for (const price of prices) {
    const regular = toAmount(price.regular_price);
    const sale = toAmount(price.discount_price);
    if (sale === 0 && regular !== null && regular > 0) {
      const end = price.discount_price?.end_datetime;
      const endDate = end ? new Date(end) : null;
      return {
        endDate: endDate && !Number.isNaN(endDate.getTime()) ? endDate : null,
      };
    }
  }
  return null;
}

export async function fetchNintendoPrices(
  nsuids: string[],
): Promise<NintendoPrice[]> {
  if (nsuids.length === 0) return [];
  const data = await fetchJson<{ prices?: NintendoPrice[] }>(
    `${PRICE_URL}?country=${NINTENDO_COUNTRY}&lang=en&ids=${nsuids.join(",")}`,
  );
  return data.prices ?? [];
}

/**
 * A Nintendo eShop game with its free-to-keep offer, or null if the game isn't in the index.
 */
export async function fetchEshopGiveaway(gameId: string): Promise<{
  game: NintendoGame;
  offer: { endDate: Date | null } | null;
} | null> {
  const game = await fetchNintendoGame(gameId);
  if (!game) return null;
  const prices = await fetchNintendoPrices(game.nsuids);
  return { game, offer: findFreeToKeepPrice(prices) };
}

// ---- Nintendo Switch Online Game Trials ---------------------------------------------------------

export interface GameTrial {
  gameId: string;
  title: string;
  banner: string | null;
}

/**
 * Read the current Game Trials from Nintendo of Europe's "Exclusive offers for members" page,
 * which lists them under "The following Game Trial is currently available".
 */
export function parseGameTrialsPage(html: string): GameTrial[] {
  const start = html.search(/Game Trials? (?:is|are) currently available/i);
  if (start === -1) return [];
  const nextHeading = html.indexOf("<h2", start);
  const section = html.slice(
    start,
    nextHeading === -1 ? undefined : nextHeading,
  );

  const trials = new Map<string, GameTrial>();
  for (const match of section.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)) {
    const anchor = match[0];
    const href = /href="([^"]+)"/.exec(anchor)?.[1];
    const gameId = href
      ? extractNintendoGameId(new URL(href, NINTENDO_SITE).toString())
      : null;
    if (!gameId || trials.has(gameId)) continue;

    const banner =
      /data-xs="([^"]+)"/.exec(anchor)?.[1] ??
      /<img[^>]*\ssrc="([^"]+\.(?:jpe?g|png|webp))"/.exec(anchor)?.[1] ??
      null;
    trials.set(gameId, {
      gameId,
      title: /title="([^"]+)"/.exec(anchor)?.[1] ?? "",
      banner,
    });
  }
  return [...trials.values()];
}

/**
 * List the current Game Trials while Nintendo shows them.
 */
export async function processNintendoGameTrials(
  db: Database,
): Promise<FeedResult> {
  const trials = parseGameTrialsPage(await fetchText(GAME_TRIALS_PAGE));
  const now = new Date();
  const result = emptyFeedResult(trials.length);

  for (const trial of trials) {
    try {
      const game = await fetchNintendoGame(trial.gameId);
      if (!game)
        throw new Error(`Game ${trial.gameId} isn't in Nintendo's index`);

      const outcome = await upsertListing(
        db,
        {
          name: game.name || trial.title,
          cover: trial.banner ?? game.cover,
          cover_portrait: game.coverPortrait,
          description: [
            "Game Trial: Nintendo Switch Online members can play the full game for free for a limited time.",
            game.description,
          ]
            .filter(Boolean)
            .join(" "),
          developer: game.developer,
          publisher: game.publisher,
          platform_ids: game.platformIds,
          provider_id: "nintendo_switch_online",
          provider_url: game.url,
          release_date: game.releaseDate,
          end_date: new Date(now.getTime() + ROLLING_LISTING_MS),
        },
        now,
      );
      result[outcome]++;
    } catch (error) {
      result.failed++;
      result.errors.push(
        `${trial.title || trial.gameId}: ${errorMessage(error)}`,
      );
    }
  }

  if (trials.length === 0) log.info("No Game Trial is running right now");
  return result;
}
