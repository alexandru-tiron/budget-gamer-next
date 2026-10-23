import { TRPCError } from "@trpc/server";
import type { Database } from "~/server/db/drivers";
import { findFreeGameByUrl, upsertFreeGame } from "./freeGames-service";
import {
  extractSteamAppId,
  fetchSteamGameDetails,
  scrapeEndDate,
} from "../utils/steam-helpers";
import { processPlayStationGame } from "../utils/playstation-helpers";
import { processHumbleGame } from "../utils/humble-helpers";
import { processGogGame } from "../utils/gog-helpers";
import {
  extractNintendoGameId,
  fetchEshopGiveaway,
} from "../utils/nintendo-helpers";
import { fetchXboxGiveaway } from "../utils/xbox-feeds";
import { extractXboxProductId, XBOX_STORE_LOCALE } from "../utils/xbox-helpers";

export type GameLinkProvider =
  | "steam"
  | "epic_games"
  | "playstation"
  | "humble_bundle"
  | "gog"
  | "xbox"
  | "nintendo_eshop";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Work out which store a link points to and return a canonical version of it (https, no query
 * string or trailing slash), so the same game always maps to the same stored URL.
 */
export function parseGameLink(
  link: string,
): { provider: GameLinkProvider; url: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(link.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return null;
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const path = parsed.pathname.replace(/\/+$/, "");

  if (host === "store.steampowered.com") {
    const appId = extractSteamAppId(path);
    if (/^\/app\/\d+/i.test(path) && appId) {
      return {
        provider: "steam",
        url: `https://store.steampowered.com/app/${appId}/`,
      };
    }
  }
  if (host === "store.epicgames.com") {
    return {
      provider: "epic_games",
      url: `https://store.epicgames.com${path}`,
    };
  }
  if (
    host === "store.playstation.com" &&
    /^\/[a-z]{2}-[a-z]{2}\/product\/[^/]+$/i.test(path)
  ) {
    return {
      provider: "playstation",
      url: `https://store.playstation.com${path}`,
    };
  }
  if (host === "humblebundle.com" && /^\/store\/[a-z0-9-]+$/i.test(path)) {
    return {
      provider: "humble_bundle",
      url: `https://www.humblebundle.com${path}`,
    };
  }
  if (host === "gog.com" && /^\/([a-z]{2}\/)?game\/[^/]+$/i.test(path)) {
    return { provider: "gog", url: `https://www.gog.com${path}` };
  }
  if (host === "xbox.com") {
    const productId = extractXboxProductId(parsed.toString());
    const slug = /\/games\/store\/([^/]+)\//i.exec(path)?.[1];
    if (productId && slug) {
      return {
        provider: "xbox",
        url: `https://www.xbox.com/${XBOX_STORE_LOCALE}/games/store/${slug.toLowerCase()}/${productId}`,
      };
    }
  }
  if (host === "nintendo.com" && extractNintendoGameId(parsed.toString())) {
    return {
      provider: "nintendo_eshop",
      url: `https://www.nintendo.com${path}`,
    };
  }

  return null;
}

/**
 * A game that is still listed doesn't need to be processed again.
 */
async function assertNotListed(db: Database, url: string): Promise<void> {
  const existingGame = await findFreeGameByUrl(db, url);
  if (existingGame && existingGame.end_date > new Date()) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "That game is already listed.",
    });
  }
}

function notFreeError(store: string) {
  return new TRPCError({
    code: "BAD_REQUEST",
    message: `This game isn't free on ${store} right now, or we couldn't read its store page.`,
  });
}

/**
 * Process a game link based on its type and add the game to the free games list
 */
export async function processGameLink(
  link: string,
  dbInstance: Database,
): Promise<{ success: boolean; provider: GameLinkProvider }> {
  const gameLink = parseGameLink(link);

  if (!gameLink) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Unsupported link. Paste a game page from Steam, GOG, Humble Bundle, the PlayStation Store, the Xbox store or Nintendo's European eShop.",
    });
  }

  const { provider, url } = gameLink;

  if (provider === "epic_games") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Epic Games freebies are added automatically every week.",
    });
  }

  const startDate = new Date();

  // Xbox and Nintendo links are matched to the store's canonical URL after the lookup
  if (provider === "xbox") {
    const productId = extractXboxProductId(url);
    const result = productId ? await fetchXboxGiveaway(productId) : null;
    if (!result) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "We couldn't find that game in the Xbox store.",
      });
    }
    await assertNotListed(dbInstance, result.game.storeUrl);
    if (!result.offer) throw notFreeError("the Xbox store");

    const { game, offer } = result;
    await upsertFreeGame(dbInstance, {
      name: game.name,
      cover: game.cover,
      cover_portrait: game.coverPortrait,
      description: game.description,
      developer: game.developer,
      publisher: game.publisher,
      platform_ids: game.platformIds,
      free: true,
      start_date: startDate,
      end_date: offer.endDate ?? new Date(startDate.getTime() + 4 * DAY_MS),
      provider_id: "xbox",
      provider_url: game.storeUrl,
      release_date: game.releaseDate,
    });
    return { success: true, provider };
  }

  if (provider === "nintendo_eshop") {
    const gameId = extractNintendoGameId(url);
    const result = gameId ? await fetchEshopGiveaway(gameId) : null;
    if (!result) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message:
          "We couldn't find that game on Nintendo's European eShop. Paste its page from nintendo.com/en-gb.",
      });
    }
    await assertNotListed(dbInstance, result.game.url);
    if (!result.offer) throw notFreeError("the Nintendo eShop");

    const { game, offer } = result;
    await upsertFreeGame(dbInstance, {
      name: game.name,
      cover: game.cover,
      cover_portrait: game.coverPortrait,
      description: game.description,
      developer: game.developer,
      publisher: game.publisher,
      platform_ids: game.platformIds,
      free: true,
      start_date: startDate,
      end_date: offer.endDate ?? new Date(startDate.getTime() + 7 * DAY_MS),
      provider_id: "nintendo_eshop",
      provider_url: game.url,
      release_date: game.releaseDate,
    });
    return { success: true, provider };
  }

  await assertNotListed(dbInstance, url);

  if (provider === "steam") {
    const appId = extractSteamAppId(url);
    if (!appId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "That Steam link has no app id.",
      });
    }

    // Check the price with the API before launching a browser for the end date
    const gameDetails = await fetchSteamGameDetails(appId);
    if (!gameDetails) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "We couldn't find that game on Steam.",
      });
    }
    if (gameDetails.discount_percent !== 100) {
      throw notFreeError("Steam");
    }

    const endDateTimestamp = await scrapeEndDate(url);
    const { discount_percent: _discount, ...details } = gameDetails;

    await upsertFreeGame(dbInstance, {
      ...details,
      free: true,
      start_date: startDate,
      // Default: 4 days from now if no end date found
      end_date: new Date(endDateTimestamp ?? startDate.getTime() + 4 * DAY_MS),
      provider_id: "steam",
      provider_url: url,
    });
  } else if (provider === "playstation") {
    const result = await processPlayStationGame(url);
    if (!result?.gameDetails.free) {
      throw notFreeError("the PlayStation Store");
    }

    await upsertFreeGame(dbInstance, {
      ...result.gameDetails,
      start_date: startDate,
      end_date: result.endDate,
      provider_id: "playstation",
      provider_url: url,
    });
  } else if (provider === "humble_bundle") {
    const result = await processHumbleGame(url);
    if (!result) {
      throw notFreeError("Humble Bundle");
    }

    await upsertFreeGame(dbInstance, {
      name: result.gameDetails.name,
      cover: result.gameDetails.cover,
      cover_portrait: result.gameDetails.cover_portrait,
      description: result.gameDetails.description,
      developer: result.gameDetails.developer,
      publisher: result.gameDetails.publisher,
      platform_ids: result.gameDetails.platform_ids,
      free: true,
      start_date: startDate,
      end_date: result.endDate,
      provider_id: "humble_bundle",
      provider_url: url,
      // Humble Bundle doesn't provide release dates
      release_date: null,
    });
  } else {
    const result = await processGogGame(url);
    if (!result) {
      throw notFreeError("GOG");
    }

    await upsertFreeGame(dbInstance, {
      ...result.gameDetails,
      start_date: startDate,
      end_date: result.endDate,
      provider_id: "gog",
      provider_url: url,
    });
  }

  return { success: true, provider };
}
