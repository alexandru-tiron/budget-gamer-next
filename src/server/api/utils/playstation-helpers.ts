import { normalizePlatformIds } from "./platforms";
import { fetchText } from "./http";
import { logger } from "~/server/logger";

const log = logger.child({ scope: "playstation" });

export interface PlayStationGameDetails {
  name: string;
  cover: string;
  cover_portrait: string;
  description: string;
  developer: string;
  publisher: string;
  platform_ids: string[];
  free: boolean;
  release_date: Date | null;
}

// The product page's server-rendered Apollo cache entry for the product
interface StoreProduct {
  name?: string;
  media?: { role?: string; url?: string }[];
  descriptions?: { type?: string; value?: string }[];
  releaseDate?: string;
  publisherName?: string;
  platforms?: string[];
}

/**
 * Parse a date string, returning null instead of an Invalid Date
 */
function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Extract game IDs from PlayStation Store URLs
 */
export function extractPsGameIds(url: string): string[] {
  const psLinkRegex =
    /https:\/\/store\.playstation\.com\/([a-zA-Z]+(-[a-zA-Z]+)+)\/product\//gi;
  const gameLinksArray = url.split(",");
  const gameIds: string[] = [];

  for (const link of gameLinksArray) {
    const trimmedLink = link.trim();
    const id = trimmedLink.replace(psLinkRegex, "").split(/[/?#]/)[0];
    if (id && id !== trimmedLink) {
      gameIds.push(id);
    }
  }

  return gameIds;
}
/**
 * Fetch game details from PlayStation Store API
 */
export async function fetchPsApiGameDetails(
  gameId: string,
): Promise<PlayStationGameDetails | null> {
  try {
    const response = await fetch(
      `https://store.playstation.com/store/api/chihiro/00_09_000/container/gb/en/999/${gameId}`,
    );
    // The legacy API now answers most products with an empty 204
    if (response.ok && response.status !== 204) {
      // Legacy API, so treat every field as optional
      const data = (await response.json()) as {
        name?: string;
        provider_name?: string;
        playable_platform?: string[] | string;
        default_sku?: {
          price?: number;
        };
        release_date?: string;
        images?: {
          url?: string;
        }[];
        long_desc?: string;
      };

      // Process images
      const imageRef = "https://image.api.playstation.com/";
      const appoloRef = "https://apollo2.dl.playstation.net/";
      const imagesArray = data.images ?? [];

      let cover = "";
      let coverPortrait = "";

      if (imagesArray.length > 1) {
        if (imagesArray[0]?.url?.includes(appoloRef)) {
          coverPortrait = imagesArray[0].url.replace(appoloRef, imageRef);
        } else {
          coverPortrait = imagesArray[0]?.url ?? "";
        }

        if (imagesArray[1]?.url?.includes(appoloRef)) {
          cover = imagesArray[1].url.replace(appoloRef, imageRef);
        } else {
          cover = imagesArray[1]?.url ?? "";
        }
      } else if (imagesArray.length === 1) {
        if (imagesArray[0]?.url?.includes(appoloRef)) {
          coverPortrait = imagesArray[0].url.replace(appoloRef, imageRef);
          cover = imagesArray[0].url.replace(appoloRef, imageRef);
        } else {
          coverPortrait = imagesArray[0]?.url ?? "";
          cover = imagesArray[0]?.url ?? "";
        }
      }

      // Clean description
      const description = data.long_desc?.replace(/<[^>]+>/g, "") ?? "";

      // Get platforms
      const platformIds = normalizePlatformIds(
        (data.playable_platform ?? []).toString().split(","),
      );

      // Check if game is free
      const isFree = data.default_sku?.price === 0;

      return {
        name: data.name ?? "",
        cover,
        cover_portrait: coverPortrait,
        description,
        developer: data.provider_name ?? "",
        publisher: data.provider_name ?? "",
        platform_ids: platformIds,
        free: isFree,
        release_date: parseDate(data.release_date),
      };
    }

    return null;
  } catch (error) {
    log.error("Error fetching PlayStation game details from API", { error });
    return null;
  }
}

/**
 * Read the product's details from a PlayStation Store product page. The page embeds its Apollo
 * cache as JSON blobs, and the price as JSON-LD.
 */
export function parsePsProductPage(
  html: string,
  gameId: string,
): PlayStationGameDetails | null {
  const productKey = `Product:${gameId}`;
  let product: StoreProduct | undefined;
  let price: number | undefined;

  for (const [, body = ""] of html.matchAll(
    /<script[^>]*type="application\/(?:json|ld\+json)"[^>]*>([\s\S]*?)<\/script>/g,
  )) {
    let data: unknown;
    try {
      data = JSON.parse(body);
    } catch {
      continue; // Not JSON, keep looking
    }
    if (!data || typeof data !== "object") continue;

    // Each blob holds part of the product, so merge them
    const cache = (data as { cache?: Record<string, StoreProduct> }).cache;
    const entry = cache?.[productKey];
    if (entry) product = { ...product, ...entry };

    const offerPrice = (data as { offers?: { price?: unknown } }).offers?.price;
    if (typeof offerPrice === "number") price = offerPrice;
  }

  if (!product?.name) return null;

  const media = product.media ?? [];
  const imageFor = (role: string) =>
    media.find((image) => image.role === role)?.url ?? "";
  const coverPortrait = imageFor("MASTER");
  const cover = imageFor("GAMEHUB_COVER_ART") || coverPortrait;

  const description =
    product.descriptions
      ?.find((desc) => desc.type === "LONG")
      // Keep line breaks, drop the rest of the markup
      ?.value?.replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "") ?? "";
  const publisher = product.publisherName?.trim() ?? "";

  return {
    name: product.name,
    cover,
    cover_portrait: coverPortrait,
    description,
    developer: publisher, // The store only lists the publisher
    publisher,
    platform_ids: normalizePlatformIds(product.platforms ?? []),
    free: price === 0,
    release_date: parseDate(product.releaseDate),
  };
}

/**
 * Get game details from the PlayStation Store product page
 */
export async function scrapePsGameDetails(
  gameId: string,
): Promise<PlayStationGameDetails | null> {
  try {
    const html = await fetchText(
      `https://store.playstation.com/en-gb/product/${gameId}`,
      { headers: { "accept-language": "en-GB,en;q=0.9" } },
    );
    return parsePsProductPage(html, gameId);
  } catch (error) {
    log.error("Error scraping PlayStation game details", { error });
    return null;
  }
}

/**
 * Process a PlayStation Store URL to get full game details.
 * Callers decide whether the game has to be free (PS Plus games are not).
 */
export async function processPlayStationGame(psUrl: string): Promise<{
  gameDetails: PlayStationGameDetails;
  endDate: Date;
} | null> {
  try {
    // Extract game ID from URL
    const gameIds = extractPsGameIds(psUrl);

    // Get first game ID (we only process one game at a time)
    const gameId = gameIds[0];
    if (!gameId) {
      throw new Error("Could not extract game ID from URL");
    }

    // The store page has the most complete details; the legacy API is a fallback
    const gameDetails =
      (await scrapePsGameDetails(gameId)) ??
      (await fetchPsApiGameDetails(gameId));

    // If both methods fail, return null
    if (!gameDetails) {
      return null;
    }

    // Calculate start date (1st of the current month)
    const startDate = new Date();
    startDate.setDate(1); // Set to the 1st of the month

    // Calculate end date (30 days from start date)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    return {
      gameDetails,
      endDate,
    };
  } catch (error) {
    log.error("Error processing PlayStation game", { error });
    return null;
  }
}
