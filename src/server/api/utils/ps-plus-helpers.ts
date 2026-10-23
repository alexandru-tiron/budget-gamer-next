import { eq } from "drizzle-orm";

import type { db } from "~/server/db";
import { subscriptionGames } from "~/server/db/schema";
import { processPlayStationGame } from "./playstation-helpers";
import {
  findSubscriptionGameByUrl,
  upsertSubscriptionGame,
} from "../services/subscriptionGames-service";
import { delay, getBrowser, newPage } from "./puppeteer-helper";
import { logger } from "~/server/logger";

const log = logger.child({ scope: "ps-plus" });

/**
 * Fetch PlayStation Plus games from the PlayStation website
 */
export async function fetchPSPlusGames(): Promise<string[]> {
  const browser = await getBrowser();

  try {
    const page = await newPage(browser);
    await page.goto(
      "https://www.playstation.com/en-gb/ps-plus/whats-new/#monthly-games",
    );

    await page.waitForSelector(
      ".cmp-experiencefragment--wn-latest-monthly-games",
    );
    await page.waitForSelector(
      ".txt-style-medium-title.txt-block-paragraph__title",
    );
    const items = await page.$$(
      ".txt-style-medium-title.txt-block-paragraph__title",
    );

    const gameTitlesArray: string[] = [];
    for (const item of items) {
      const titleText = await item.getProperty("innerText");
      const subName = await titleText.jsonValue();
      if (typeof subName === "string" && !subName.includes("More games")) {
        gameTitlesArray.push(subName.trim());
      }
    }

    log.info("Found PS Plus game titles", { gameTitlesArray });
    const gameUrls = new Set<string>();

    // Reuse one tab for every search
    const searchPage = await newPage(browser);
    for (const gameTitle of gameTitlesArray) {
      await searchPage.goto(
        `https://store.playstation.com/en-gb/search/${encodeURIComponent(gameTitle)}`,
      );
      await searchPage.waitForSelector(".psw-grid-list.psw-l-grid");
      await delay(200);
      await searchPage.hover(".psw-grid-list.psw-l-grid");
      const searchResults = await searchPage.$$(".psw-grid-list.psw-l-grid li");

      for (const game of searchResults) {
        const firstResultDiv = await game.$("div");
        const firstResultDivA = await firstResultDiv?.$("a");

        if (firstResultDivA) {
          const telemetryMeta = await firstResultDivA.evaluate((el) =>
            el.getAttribute("data-telemetry-meta"),
          );
          if (telemetryMeta) {
            try {
              interface TelemetryData {
                id: string;
                [key: string]: unknown;
              }
              const gameResponse = JSON.parse(telemetryMeta) as TelemetryData;
              const gameId = gameResponse.id;

              const querySection = await game.$eval(
                "div > a > div > section",
                (section) => {
                  const divs = section.querySelectorAll("div");
                  return divs[0]?.innerText ?? "";
                },
              );

              if (querySection === "Essential") {
                log.info("Found essential game", { gameId });
                gameUrls.add(
                  `https://store.playstation.com/en-gb/product/${gameId}`,
                );
              }
            } catch (error) {
              log.error("Error parsing game data", { error });
            }
          }
        }
      }
    }
    await searchPage.close();

    return [...gameUrls];
  } catch (error) {
    log.error("Error fetching PS Plus games", { error });
    throw error;
  } finally {
    await browser.close();
  }
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
