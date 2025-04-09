import puppeteer from "puppeteer";
import type { db } from "~/server/db";
import { subscriptionGames } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

interface AmazonPrimeGameDetails {
  name: string;
  cover: string;
  cover_portrait: string;
  description: string;
  developer: string;
  publisher: string;
  platform_ids: string[];
  is_free: boolean;
  release_date: Date;
  end_date: Date;
}

/**
 * Scrape Amazon Prime games from the gaming.amazon.com website
 */
export async function scrapeAmazonPrimeGames(): Promise<
  AmazonPrimeGameDetails[]
> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: null,
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: 1440,
      height: 1080,
      deviceScaleFactor: 1,
    });
    page.setDefaultNavigationTimeout(0);
    await page.goto("https://gaming.amazon.com/home?filter=Game");
    await page.waitForSelector('[data-a-target="prime-footer"]');
    await page.hover('[data-a-target="prime-footer"]');
    await page.waitForSelector(
      '[data-a-target="offer-list-FGWP_FULL"] .offer-list__content__grid .tw-block [data-a-target="item-card"]',
    );

    const gameHandles = await page.$$(
      '[data-a-target="offer-list-FGWP_FULL"] .offer-list__content__grid .tw-block [data-a-target="item-card"]',
    );

    const primeGames: AmazonPrimeGameDetails[] = [];

    for (const gameHandle of gameHandles) {
      let description = "";
      let publisher = "";
      let provider_url = "https://gaming.amazon.com/home?filter=Game";
      let isIndexPage = false;

      const cover = await page.evaluate(
        (el) => el.querySelector("img.tw-image")?.getAttribute("src") ?? "",
        gameHandle,
      );

      const title = await page.evaluate(
        (el) => el.querySelector("h3")?.textContent ?? "",
        gameHandle,
      );

      let ageText = await page.evaluate((el) => {
        const element = el.querySelector("p.tw-c-text-white.tw-font-size-7");
        return element ? (element.textContent ?? "") : "";
      }, gameHandle);

      try {
        const url = await page.evaluate(
          (el) => el.querySelector("a")?.getAttribute("href") ?? "",
          gameHandle,
        );
        if (url) {
          provider_url = "https://gaming.amazon.com" + String(url);
        }
      } catch (error) {
        console.log(error, "Error getting provider url");
        isIndexPage = true;
      }

      if (isIndexPage) {
        await page.evaluate((el) => {
          const imgElement = el.querySelector("img.tw-image");
          if (imgElement instanceof HTMLElement) {
            imgElement.click();
          }
        }, gameHandle);
        const descHandles = await page.$$(".AnimatedShowMore__MainContent");

        for (const descHandle of descHandles) {
          description = await page.evaluate((el) => {
            const p = el.querySelector("p");
            return p ? (p.textContent ?? "") : "";
          }, descHandle);
        }

        await page.waitForSelector('[data-a-target="gms-content-supertext"]');
        const pubHandles = await page.$$(
          '[data-a-target="gms-content-supertext"]',
        );

        for (const pubHandle of pubHandles) {
          publisher = await page.evaluate((el) => {
            const h2 = el.querySelector("h2");
            return h2 ? (h2.textContent ?? "") : "";
          }, pubHandle);
        }
      } else {
        const descPage = await browser.newPage();
        await descPage.setViewport({
          width: 1440,
          height: 1080,
          deviceScaleFactor: 1,
        });
        descPage.setDefaultNavigationTimeout(0);
        await descPage.goto(`${provider_url}`);
        await descPage.waitForSelector(
          "h2.tw-amazon-ember-light.tw-font-size-2",
        );

        try {
          await new Promise((resolve) => setTimeout(resolve, 100));
          await descPage.hover('[data-a-target="faq-section"]');
        } catch (error) {
          console.log(error, "Error hovering over FAQ section");
          // Ignore hover errors
        }

        description = await descPage.evaluate(() => {
          let par1 = "";
          let par2 = "";

          try {
            const element = document.querySelector(
              ".highlight-card__overlay__content",
            );
            par1 = element ? (element.textContent ?? "") : "";
          } catch (error) {
            console.log(error, "Error getting overlay content");
            try {
              const element = document.querySelector(
                ".highlight-card__overlay",
              );
              par1 = element ? (element.textContent ?? "") : "";
            } catch (error) {
              console.log(error, "Error getting overlay content");
              try {
                const element = document.querySelector(
                  ".highlight-card__content",
                );
                par1 = element ? (element.textContent ?? "") : "";
              } catch (error) {
                console.log(error, "Error getting overlay content");
                // Ignore errors
              }
            }
          }

          const par1mod = par1.replace("\n\n", ". ");

          try {
            const element = document.querySelector(
              "div.tw-font-size-5.tw-typeset p.tw-amazon-ember-light.tw-md-font-size-4",
            );
            par2 = element ? (element.innerHTML ?? "") : "";
            return par1mod + ". " + par2;
          } catch (error) {
            console.log(error, "Error getting overlay content");
            return par1mod;
          }
        });

        await descPage.close();
      }

      // Process age text to get end date
      if (ageText === "Ends today") {
        ageText = "1";
      }

      const daysRemaining = parseInt(ageText.replace(/\D/g, "")) || 30;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysRemaining);

      // Set start date to 1st of current month
      const startDate = new Date();
      startDate.setDate(1);

      primeGames.push({
        name: title,
        cover,
        cover_portrait: cover,
        description,
        developer: "",
        publisher,
        platform_ids: ["windows"],
        is_free: false,
        release_date: startDate,
        end_date: endDate,
      });
    }

    await page.close();
    return primeGames;
  } catch (error) {
    console.error("Error scraping Amazon Prime games:", error);
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

        // Add game to database
        await dbInstance.insert(subscriptionGames).values({
          name: game.name,
          cover: game.cover,
          cover_portrait: game.cover_portrait,
          description: game.description,
          developer: game.developer,
          publisher: game.publisher,
          platform_ids: game.platform_ids,
          start_date: game.release_date,
          end_date: game.end_date,
          provider_id: "amazon_games",
          provider_url: "https://gaming.amazon.com/home?filter=Game",
          release_date: game.release_date,
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
    console.error("Error processing Amazon Prime games:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to process Amazon Prime games: ${errorMessage}`);
  }
}
