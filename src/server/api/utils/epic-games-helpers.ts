import type { db } from "~/server/db";
import { freeGames } from "~/server/db/schema";
import { eq } from "drizzle-orm";

interface EpicGameDetails {
  name: string;
  cover: string;
  cover_portrait: string;
  description: string;
  developer: string;
  publisher: string;
  platform_ids: string[];
  is_free: boolean;
  start_date: Date;
  end_date: Date;
  provider_url: string;
  release_date: Date;
}

// Epic Games API response types
interface EpicGamePromotion {
  startDate: string;
  endDate: string;
  discountSetting: {
    discountPercentage: number | null;
  };
}

interface EpicGamePromotions {
  promotionalOffers: Array<{
    promotionalOffers: EpicGamePromotion[];
  }>;
  upcomingPromotionalOffers: Array<{
    promotionalOffers: EpicGamePromotion[];
  }>;
}

interface EpicGameImage {
  url: string;
}

interface EpicGameMapping {
  pageSlug: string;
}

interface EpicGameCatalogNs {
  mappings: EpicGameMapping[];
}

interface EpicGamePrice {
  totalPrice: {
    discountPrice: number;
  };
}

interface EpicGameSeller {
  name: string;
}

interface EpicGame {
  title: string;
  description: string;
  effectiveDate: string;
  productSlug?: string;
  catalogNs: EpicGameCatalogNs;
  keyImages: EpicGameImage[];
  price: EpicGamePrice;
  seller: EpicGameSeller;
  promotions?: EpicGamePromotions;
}

interface EpicGamesResponse {
  data: {
    Catalog: {
      searchStore: {
        elements: EpicGame[];
      };
    };
  };
}

/**
 * Fetch free games from Epic Games Store API
 */
export async function fetchEpicFreeGames(): Promise<EpicGameDetails[]> {
  try {
    const response = await fetch(
      "https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Epic Games: ${response.statusText}`);
    }

    const result = await response.text();
    const gameInfo = JSON.parse(result) as EpicGamesResponse;
    const elements = gameInfo.data.Catalog.searchStore.elements;
    const epicGames: EpicGameDetails[] = [];

    for (const game of elements) {
      // Skip games without promotions
      if (!game.promotions) continue;

      let startDate: Date | undefined;
      let endDate: Date | undefined;
      let isFree = false;
      let isAvailable = false;

      // Check for current promotional offers
      if (game.promotions?.promotionalOffers?.length > 0) {
        const promo =
          game.promotions.promotionalOffers[0]?.promotionalOffers[0];
        if (promo && promo.discountSetting.discountPercentage !== null) {
          startDate = new Date(promo.startDate);
          endDate = new Date(promo.endDate);
        }
      }
      // Check for upcoming promotional offers
      else if (game.promotions?.upcomingPromotionalOffers?.length > 0) {
        const promo =
          game.promotions.upcomingPromotionalOffers[0]?.promotionalOffers[0];
        if (promo && promo.discountSetting.discountPercentage !== null) {
          startDate = new Date(promo.startDate);
          endDate = new Date(promo.endDate);
        }
      }

      // If no valid dates found, skip this game
      if (!startDate || !endDate) {
        startDate = new Date(Date.now() - 2588000000);
        endDate = new Date(Date.now() - 2588000000);
      }

      // Check if game is currently available
      const now = new Date();
      isAvailable = startDate <= now && now < endDate;

      // Check if game is free
      isFree = game.price.totalPrice.discountPrice === 0;

      // Skip if not free or not available
      if (!isFree || !isAvailable) continue;

      // Get provider URL
      let providerUrl = "";
      if (game.productSlug) {
        providerUrl = `https://store.epicgames.com/en-US/p/${game.productSlug}`;
      } else if (game.catalogNs.mappings.length > 0) {
        providerUrl = `https://store.epicgames.com/en-US/p/${game.catalogNs.mappings[0]?.pageSlug}`;
      }

      // Skip if no provider URL
      if (!providerUrl) continue;

      // Get images
      const cover = game.keyImages?.[0]?.url;
      const coverPortrait = game.keyImages?.[1]?.url;

      // Skip if missing images
      if (!cover || !coverPortrait) continue;

      // Add game to array
      epicGames.push({
        name: game.title,
        cover,
        cover_portrait: coverPortrait,
        description: game.description,
        developer: game.seller.name,
        publisher: game.seller.name,
        platform_ids: ["windows"],
        is_free: isFree,
        start_date: startDate,
        end_date: endDate,
        provider_url: providerUrl,
        release_date: new Date(game.effectiveDate),
      });
    }

    return epicGames;
  } catch (error) {
    console.error("Error fetching Epic Games:", error);
    throw error;
  }
}

/**
 * Process Epic Games and add them to the database
 */
export async function processEpicGames(dbInstance: typeof db): Promise<{
  total: number;
  added: number;
  updated: number;
  failed: number;
  errors: string[];
}> {
  try {
    // Fetch games from Epic Games Store
    const epicGames = await fetchEpicFreeGames();

    // Track results
    const results = {
      total: epicGames.length,
      added: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each game
    for (const game of epicGames) {
      try {
        // Check if game already exists
        const existingGame = await dbInstance.query.freeGames.findFirst({
          where: eq(freeGames.provider_url, game.provider_url),
        });

        if (existingGame) {
          // Update existing game
          await dbInstance
            .update(freeGames)
            .set({
              cover: game.cover.replace(/ /g, "%20"),
              cover_portrait: game.cover_portrait.replace(/ /g, "%20"),
              free: game.is_free,
              description: game.description,
              developer: game.developer,
              start_date: game.start_date,
              end_date: game.end_date,
              name: game.name,
              platform_ids: game.platform_ids,
              provider_id: "epic_games",
              provider_url: game.provider_url.replace(/ /g, "%20"),
              publisher: game.publisher,
              release_date: game.release_date,
            })
            .where(eq(freeGames.id, existingGame.id));

          results.updated++;
        } else {
          // Add new game
          await dbInstance.insert(freeGames).values({
            cover: game.cover.replace(/ /g, "%20"),
            cover_portrait: game.cover_portrait.replace(/ /g, "%20"),
            free: game.is_free,
            description: game.description,
            developer: game.developer,
            start_date: game.start_date,
            end_date: game.end_date,
            name: game.name,
            platform_ids: game.platform_ids,
            provider_id: "epic_games",
            provider_url: game.provider_url.replace(/ /g, "%20"),
            publisher: game.publisher,
            release_date: game.release_date,
          });

          results.added++;
        }
      } catch (error) {
        results.failed++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`${game.name}: ${errorMessage}`);
      }
    }

    return results;
  } catch (error) {
    console.error("Error processing Epic Games:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to process Epic Games: ${errorMessage}`);
  }
}
