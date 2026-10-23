import type { db } from "~/server/db";
import { logger } from "~/server/logger";
import {
  findSubscriptionGameByUrl,
  replaceSubscriptionGames,
} from "../services/subscriptionGames-service";
import { normalizePlatformIds } from "./platforms";
import { getBrowser, newPage } from "./puppeteer-helper";

const log = logger.child({ scope: "humble-choice" });

interface HumbleChoiceGameDetails {
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
  release_date: string;
}

// Scraped from a data attribute, so any field may be missing
type HumbleChoiceGameResponse = Record<
  string,
  {
    title?: string;
    image?: string;
    recommendation_copy_dict?: {
      copy: string;
    };
    platforms?: string[];
  }
>;

/**
 * Fetch Humble Choice games from the Humble Bundle website
 */
export async function fetchHumbleChoiceGames(): Promise<
  HumbleChoiceGameDetails[]
> {
  log.info("Starting Humble Choice games scraping...");

  const browser = await getBrowser();

  try {
    const page = await newPage(browser);
    await page.goto(
      "https://www.humblebundle.com/membership?hmb_source=search_bar",
      {
        waitUntil: "domcontentloaded",
      },
    );

    // Extract the JSON data from the page
    const subsJson = await page.$eval(
      "button.read-our-recommendation.js-read-our-recommendation.mobile-only.text-button.no-style-button",
      (element) => element.getAttribute("data-content-choice-data") ?? "{}",
    );

    const subsResponse = JSON.parse(subsJson) as HumbleChoiceGameResponse;
    const subsIds = Object.keys(subsResponse);
    const humbleGames: HumbleChoiceGameDetails[] = [];

    for (const id of subsIds) {
      const game = subsResponse[id];
      if (!game?.title) continue;

      // Process platforms
      const finalPlatformIds = normalizePlatformIds(
        game.platforms ?? [],
      ).filter((platform) => ["windows", "mac_os", "linux"].includes(platform));

      // Set dates
      const startDate = new Date(Date.now() - 2592000000); // 30 days ago
      const endDate = new Date(startDate.getTime() + 5184000000); // 60 days from start

      // Create provider URL
      const searchTerms = game.title
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`'~()]/g, "")
        .split(" ")
        .slice(0, 3)
        .join(" ");
      const providerUrl = `https://www.humblebundle.com/store/search?sort=bestselling&search=${searchTerms}`;

      // Add game to array
      humbleGames.push({
        name: game.title,
        cover: game.image ?? "",
        cover_portrait: game.image ?? "",
        description:
          game.recommendation_copy_dict?.copy.replace(/<[^>]+>/g, "") ?? "",
        developer: "",
        publisher: "",
        platform_ids:
          finalPlatformIds.length > 0 ? finalPlatformIds : ["windows"],
        is_free: false,
        start_date: startDate,
        end_date: endDate,
        provider_url: providerUrl,
        release_date: "",
      });
    }

    return humbleGames;
  } catch (error) {
    log.error("Error fetching Humble Choice games", { error });
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Process Humble Choice games and add them to the database
 */
export async function processHumbleChoiceGames(dbInstance: typeof db): Promise<{
  total: number;
  added: number;
  failed: number;
  errors: string[];
}> {
  try {
    // Fetch games from Humble Bundle
    const humbleGames = await fetchHumbleChoiceGames();

    // Track results
    const results = {
      total: humbleGames.length,
      added: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Check if any games exist
    if (humbleGames.length === 0) {
      return results;
    }

    // Check if the first game already exists
    const existingGame = await findSubscriptionGameByUrl(
      dbInstance,
      "humble_bundle",
      humbleGames[0]?.provider_url ?? "",
    );

    if (existingGame) {
      log.info("Humble Choice games already exist in the database");
      return results;
    }

    // One row per store URL, so the unique index can't reject the whole month
    const rows = new Map(
      humbleGames.map((game) => {
        const providerUrl = game.provider_url.replace(/ /g, "%20");
        return [
          providerUrl,
          {
            cover: game.cover.replace(/ /g, "%20"),
            cover_portrait: game.cover_portrait.replace(/ /g, "%20"),
            description: game.description,
            developer: game.developer,
            start_date: game.start_date,
            end_date: game.end_date,
            name: game.name,
            platform_ids: game.platform_ids,
            provider_id: "humble_bundle",
            provider_url: providerUrl,
            publisher: game.publisher,
            release_date: game.release_date
              ? new Date(game.release_date)
              : null,
          },
        ];
      }),
    );

    // Replace last month's games in one transaction
    try {
      await replaceSubscriptionGames(dbInstance, "humble_bundle", [
        ...rows.values(),
      ]);
      results.added = rows.size;
    } catch (error) {
      results.failed = rows.size;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      results.errors.push(errorMessage);
    }

    return results;
  } catch (error) {
    log.error("Error processing Humble Choice games", { error });
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to process Humble Choice games: ${errorMessage}`);
  }
}
