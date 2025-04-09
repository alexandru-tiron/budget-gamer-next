import puppeteer from "puppeteer";
import type { db } from "~/server/db";
import { subscriptionGames } from "~/server/db/schema";
import { eq } from "drizzle-orm";

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

type HumbleChoiceGameResponse = Record<string, {
    title: string;
    image: string;
    recommendation_copy_dict: {
      copy: string;
    };
    platforms: string[];
  }>;

/**
 * Fetch Humble Choice games from the Humble Bundle website
 */
export async function fetchHumbleChoiceGames(): Promise<
  HumbleChoiceGameDetails[]
> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    await page.goto(
      "https://www.humblebundle.com/membership?hmb_source=search_bar",
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

      // Process platforms
      const finalPlatformIds: string[] = [];
      for (const platform of game?.platforms ?? []) {
        if (platform === "windows") {
          finalPlatformIds.push("windows");
        } else if (platform === "mac") {
          finalPlatformIds.push("mac_os");
        } else if (platform === "linux") {
          finalPlatformIds.push("linux");
        }
      }

      // Set dates
      const startDate = new Date(Date.now() - 2592000000); // 30 days ago
      const endDate = new Date(startDate.getTime() + 5184000000); // 60 days from start

      // Create provider URL
      const providerUrl = `https://www.humblebundle.com/store/search?sort=bestselling&search=${game?.title
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`'~()]/g, "")
        .split(" ")
        .slice(0, 3)
        .join(" ")}`;

      // Add game to array
      humbleGames.push({
        name: game?.title ?? "" ,
        cover: game?.image ?? "",
        cover_portrait: game?.image ?? "",
        description: game?.recommendation_copy_dict.copy.replace(/<[^>]+>/g, "") ?? "",
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
    console.error("Error fetching Humble Choice games:", error);
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
    const existingGame = await dbInstance.query.subscriptionGames.findFirst({
      where: eq(subscriptionGames.provider_url, humbleGames[0]?.provider_url ?? ""),
    });

    if (existingGame) {
      console.log("Humble Choice games already exist in the database");
      return results;
    }

    // Remove all existing Humble Choice games
    await dbInstance
      .delete(subscriptionGames)
      .where(eq(subscriptionGames.provider_id, "humble_bundle"));

    // Process each game
    for (const game of humbleGames) {
      try {
        // Add new game
        await dbInstance.insert(subscriptionGames).values({
          cover: game.cover.replace(/ /g, "%20"),
          cover_portrait: game.cover_portrait.replace(/ /g, "%20"),
          description: game.description,
          developer: game.developer,
          start_date: game.start_date,
          end_date: game.end_date,
          name: game.name,
          platform_ids: game.platform_ids,
          provider_id: "humble_bundle",
          provider_url: game.provider_url.replace(/ /g, "%20"),
          publisher: game.publisher,
          release_date: game.release_date ? new Date(game.release_date) : null,
        });

        results.added++;
      } catch (error) {
        results.failed++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`${game.name}: ${errorMessage}`);
      }
    }

    return results;
  } catch (error) {
    console.error("Error processing Humble Choice games:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to process Humble Choice games: ${errorMessage}`);
  }
}
