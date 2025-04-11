import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import type { db } from "~/server/db";
import { subscriptionGames } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { processPlayStationGame } from "./playstation-helpers";
import { createSubscriptionGame } from "../services/subscriptionGames-service";

/**
 * Helper function to delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch PlayStation Plus games from the PlayStation website
 */
export async function fetchPSPlusGames(): Promise<string[]> {
  const browser = await puppeteerCore.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  try {
    if (!browser) {
      throw new Error("Browser not found");
    }
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    await page.goto(
      "https://www.playstation.com/en-gb/ps-plus/whats-new/#monthly-games",
    );

    await page.waitForSelector(
      ".cmp-experiencefragment--wn-latest-monthly-games",
      { timeout: 10000 },
    );
    await page.waitForSelector(
      ".txt-style-medium-title.txt-block-paragraph__title",
      { timeout: 10000 },
    );
    const items = await page.$$(
      ".txt-style-medium-title.txt-block-paragraph__title",
    );

    const gameTitlesArray: string[] = [];
    for (const item of items) {
      if (item) {
        const titleText = await item.getProperty("innerText");
        const subName = await titleText.jsonValue();
        if (typeof subName === "string" && !subName.includes("More games")) {
          gameTitlesArray.push(subName);
        }
      }
    }

    console.log("Found PS Plus game titles:", gameTitlesArray);
    const gameUrls: string[] = [];

    for (const gameTitle of gameTitlesArray) {
      const descPage = await browser.newPage();
      await descPage.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      });
      descPage.setDefaultNavigationTimeout(0);
      await descPage.goto(
        `https://store.playstation.com/en-gb/search/${gameTitle}`,
      );
      await descPage.waitForSelector(".psw-grid-list.psw-l-grid");
      await delay(200);
      await descPage.hover(".psw-grid-list.psw-l-grid");
      const searchResults = await descPage.$$(".psw-grid-list.psw-l-grid li");

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
                console.log("Found essential game:", gameId);
                gameUrls.push(
                  `https://store.playstation.com/en-gb/product/${gameId}`,
                );
              }
            } catch (error) {
              console.error("Error parsing game data:", error);
            }
          }
        }
      }
      await descPage.close();
    }

    return gameUrls;
  } catch (error) {
    console.error("Error fetching PS Plus games:", error);
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
      failed: 0,
      errors: [] as string[],
    };

    // Process each game URL
    for (const url of gameUrls) {
      try {
        // Check if game already exists
        const existingGame = await dbInstance.query.subscriptionGames.findFirst(
          {
            where: eq(subscriptionGames.provider_url, url),
          },
        );

        if (existingGame) {
          console.log(`Game already exists: ${url}`);
          continue;
        }
        // Calculate start date (1st of the current month)
        const startDate = new Date();
        startDate.setDate(1); // Set to the 1st of the month
        // Process the game using the existing PlayStation helper
        const result = await processPlayStationGame(url);
        if (result) {
          await createSubscriptionGame(dbInstance, {
            ...result.gameDetails,
            end_date: result.endDate,
            start_date: startDate,
            provider_id: "playstation",
            provider_url: url,
          });
          results.added++;
        }
      } catch (error) {
        results.failed++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`${url}: ${errorMessage}`);
      }
    }

    return results;
  } catch (error) {
    console.error("Error processing PS Plus games:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to process PS Plus games: ${errorMessage}`);
  }
}
