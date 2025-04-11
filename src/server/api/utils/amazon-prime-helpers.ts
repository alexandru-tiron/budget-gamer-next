import type { db } from "~/server/db";
import { subscriptionGames } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getBrowser } from "./puppeteer-helper";

interface AmazonPrimeGameDetails {
  name: string;
  cover: string;
  cover_portrait: string;
  description: string;
  developer: string;
  publisher: string;
  platform_ids: string[];
  release_date: Date;
  end_date: Date;
}

/**
 * Scrape Amazon Prime games from the gaming.amazon.com website
 */
export async function scrapeAmazonPrimeGames(): Promise<
  AmazonPrimeGameDetails[]
> {
  console.log("Starting Amazon Prime games scraping...");
  const startTime = Date.now();

  const browser = await getBrowser();

  try {
    if (!browser) {
      throw new Error("Failed to launch browser");
    }

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    );

    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // Set shorter timeouts
    page.setDefaultNavigationTimeout(15000);
    page.setDefaultTimeout(5000);

    console.log("Navigating to Amazon Prime Gaming page...");
    await page.goto("https://gaming.amazon.com/home?filter=Game", {
      waitUntil: "domcontentloaded",
    });

    // Wait for game cards with a shorter timeout
    try {
      await page.waitForSelector(".item-card__action", {
        timeout: 5000,
      });
    } catch (error) {
      console.log(
        "Game cards not found, trying alternative selector...",
        error,
      );
      try {
        await page.waitForSelector(".tw-block .item-card__action", {
          timeout: 3000,
        });
      } catch (error) {
        console.log(
          "Alternative selector not found, proceeding with available elements",
          error,
        );
      }
    }

    const gameHandles = await page.$$(".item-card__action");
    console.log(`Found ${gameHandles.length} game cards`);

    const gamePromises = gameHandles.map(async (gameHandle) => {
      try {
        // Extract basic info first
        const title =
          (await gameHandle.evaluate((el) =>
            el.querySelector("h3")?.textContent?.trim(),
          )) ?? "";
        let cover =
          (await gameHandle.evaluate((el) =>
            el.querySelector('img[src*="images"]')?.getAttribute("src"),
          )) ?? "";
        const url =
          (await gameHandle.evaluate((el) =>
            el.querySelector("a")?.getAttribute("href"),
          )) ?? "";

        if (!title) {
          console.log("Skipping game - no title found");
          return null;
        }
        if (url) {
          const provider_url = "https://gaming.amazon.com" + url;
          try {
            const descPage = await browser.newPage();
            descPage.setDefaultTimeout(5000);
            await descPage.goto(provider_url, {
              waitUntil: "domcontentloaded",
            });

            // Try to get description and other details in parallel
            const details = await descPage.evaluate(() => {
              const getText = (selector: string) =>
                document.querySelector(selector)?.textContent?.trim() ?? "";

              const getImage = (selector: string) =>
                document.querySelector(selector)?.getAttribute("src") ?? "";

              return {
                description:
                  getText('[data-a-target="ExpandableText"]') ||
                  getText(".highlight-card__overlay") ||
                  getText(".highlight-card__content"),
                publisher: getText('[data-a-target="Publisher"]'),
                developer: getText('[data-a-target="Developer"]'),
                release_date: getText('[data-a-target="ReleaseDate"]'),
                ageText: getText(".availability-date"),
                // Try multiple selectors for cover image
                cover:
                  getImage("picture.tw-picture img.tw-full-width") ||
                  getImage('img[src*="images"]') ||
                  getImage(".game-image img") ||
                  getImage(".game-cover img"),
              };
            });
            console.log(details);

            const description = details.description;
            const publisher = details.publisher;
            const developer = details.developer;
            const release_date = details.release_date;
            const ageText = details.ageText;
            // If we didn't have a cover from the main page, use the one from the detail page
            if (!cover && details.cover) {
              cover = details.cover;
            }

            await descPage.close();
            // Process age text to get end date
            const daysRemaining = parseInt(
              /\(in (\d+) days\)/.exec(ageText)?.[1] ?? "30",
            );
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + daysRemaining);
            console.log(endDate);
            // Set start date to 1st of current month
            const startDate = new Date();
            startDate.setDate(1);

            return {
              name: title,
              cover: cover || "", // Ensure we always have a string, even if empty
              cover_portrait: cover || "", // Same for portrait
              description,
              developer,
              publisher,
              platform_ids: ["windows"],
              release_date: new Date(release_date),
              end_date: endDate,
            };
          } catch (error) {
            console.log(`Error getting details for ${title}:`, error);
          }
        }
      } catch (error) {
        console.log("Error processing game:", error);
        return null;
      }
    });

    // Process games in parallel
    const results = await Promise.all(gamePromises);
    const validGames = results.filter(
      (game): game is AmazonPrimeGameDetails => game !== null,
    );

    console.log(
      `Successfully processed ${validGames.length} games in ${(Date.now() - startTime) / 1000} seconds`,
    );
    return validGames;
  } catch (error) {
    console.error("Error scraping Amazon Prime games:", error);
    return [];
  } finally {
    await browser?.close();
  }
}

/**
 * Process Amazon Prime games and add them to the database
 */
export async function processAmazonPrimeGames(dbInstance: typeof db): Promise<{
  total: number;
  added: number;
  failed: number;
  errors: string[];
}> {
  try {
    // Scrape games from Amazon Prime
    const primeGames = await scrapeAmazonPrimeGames();

    // Track results
    const results = {
      total: primeGames.length,
      added: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each game
    for (const game of primeGames) {
      try {
        // Check if game already exists
        const existingGame = await dbInstance.query.subscriptionGames.findFirst(
          {
            where: and(
              eq(subscriptionGames.name, game.name),
              eq(subscriptionGames.provider_id, "amazon_games"),
            ),
          },
        );

        if (existingGame) {
          console.log(`Game already exists: ${game.name}`);
          continue;
        }
        const startDate = new Date();
        startDate.setDate(1);
        // console.log(game);
        // Add game to database
        await dbInstance.insert(subscriptionGames).values({
          name: game.name,
          cover: game.cover,
          cover_portrait: game.cover_portrait,
          description: game.description,
          developer: game.developer,
          publisher: game.publisher,
          platform_ids: game.platform_ids,
          start_date: startDate,
          end_date: game.end_date,
          provider_id: "amazon_games",
          provider_url: "https://gaming.amazon.com/home?filter=Game",
          release_date: game.release_date,
        });

        results.added++;
      } catch (error) {
        results.failed++;
        console.log(game);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`${game.name}: ${errorMessage}`);
      }
    }

    return results;
  } catch (error) {
    console.error("Error processing Amazon Prime games:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to process Amazon Prime games: ${errorMessage}`);
  }
}
