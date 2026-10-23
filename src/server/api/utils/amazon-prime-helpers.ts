import type { db } from "~/server/db";
import { upsertSubscriptionGame } from "../services/subscriptionGames-service";
import { getBrowser, mapWithConcurrency, newPage } from "./puppeteer-helper";
import { logger } from "~/server/logger";

const log = logger.child({ scope: "amazon-prime" });

const PRIME_GAMING_URL = "https://gaming.amazon.com/home?filter=Game";

interface AmazonPrimeGameDetails {
  name: string;
  cover: string;
  cover_portrait: string;
  description: string;
  developer: string;
  publisher: string;
  platform_ids: string[];
  release_date: Date | null;
  end_date: Date;
  provider_url: string;
}

/**
 * Scrape Amazon Prime games from the gaming.amazon.com website
 */
export async function scrapeAmazonPrimeGames(): Promise<
  AmazonPrimeGameDetails[]
> {
  log.info("Starting Amazon Prime games scraping...");
  const startTime = Date.now();

  const browser = await getBrowser();

  try {
    const page = await newPage(browser);

    log.info("Navigating to Amazon Prime Gaming page...");
    await page.goto(PRIME_GAMING_URL, {
      waitUntil: "domcontentloaded",
    });

    // Wait for game cards with a shorter timeout
    try {
      await page.waitForSelector(".item-card__action", {
        timeout: 5000,
      });
    } catch (error) {
      log.debug("Game cards not found, trying alternative selector", {
        error,
      });
      try {
        await page.waitForSelector(".tw-block .item-card__action", {
          timeout: 3000,
        });
      } catch (error) {
        log.debug(
          "Alternative selector not found, proceeding with available elements",
          { error },
        );
      }
    }

    // Extract basic info from every card first
    const cards = await page.$$eval(".item-card__action", (elements) =>
      elements.map((el) => ({
        title: el.querySelector("h3")?.textContent?.trim() ?? "",
        cover:
          el.querySelector('img[src*="images"]')?.getAttribute("src") ?? "",
        href: el.querySelector("a")?.getAttribute("href") ?? "",
      })),
    );
    log.info(`Found ${cards.length} game cards`);

    const validCards = cards.filter((card) => card.title && card.href);

    // Open detail pages a few at a time to keep memory use low
    const results = await mapWithConcurrency(
      validCards,
      3,
      async (card): Promise<AmazonPrimeGameDetails | null> => {
        const provider_url = new URL(card.href, PRIME_GAMING_URL).toString();
        const descPage = await newPage(browser);

        try {
          await descPage.goto(provider_url, {
            waitUntil: "domcontentloaded",
          });

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

          // Process age text to get end date
          const daysRemaining = parseInt(
            /\(in (\d+) days\)/.exec(details.ageText)?.[1] ?? "30",
          );
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + daysRemaining);

          const releaseDate = new Date(details.release_date);
          const cover = card.cover || details.cover;

          return {
            name: card.title,
            cover,
            cover_portrait: cover,
            description: details.description,
            developer: details.developer,
            publisher: details.publisher,
            platform_ids: ["windows"],
            release_date: Number.isNaN(releaseDate.getTime())
              ? null
              : releaseDate,
            end_date: endDate,
            provider_url,
          };
        } catch (error) {
          log.warn("Error getting game details", { game: card.title, error });
          return null;
        } finally {
          await descPage.close();
        }
      },
    );

    const validGames = results.filter(
      (game): game is AmazonPrimeGameDetails => game != null,
    );

    log.info("Scraped Amazon Prime games", {
      games: validGames.length,
      durationMs: Date.now() - startTime,
    });
    return validGames;
  } catch (error) {
    log.error("Error scraping Amazon Prime games", { error });
    return [];
  } finally {
    await browser.close();
  }
}

/**
 * Process Amazon Prime games and add them to the database
 */
export async function processAmazonPrimeGames(dbInstance: typeof db): Promise<{
  total: number;
  added: number;
  updated: number;
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
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Set start date to 1st of current month
    const startDate = new Date();
    startDate.setDate(1);

    // Process each game
    for (const game of primeGames) {
      try {
        const outcome = await upsertSubscriptionGame(dbInstance, {
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
          provider_url: game.provider_url,
          release_date: game.release_date,
        });

        results[outcome]++;
      } catch (error) {
        results.failed++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`${game.name}: ${errorMessage}`);
      }
    }

    return results;
  } catch (error) {
    log.error("Error processing Amazon Prime games", { error });
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to process Amazon Prime games: ${errorMessage}`);
  }
}
