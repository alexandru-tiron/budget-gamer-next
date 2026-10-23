import { normalizePlatformIds } from "./platforms";
import { delay, getBrowser, newPage } from "./puppeteer-helper";
import { logger } from "~/server/logger";

const log = logger.child({ scope: "gog" });

interface GogGameDetails {
  name: string;
  cover: string;
  cover_portrait: string;
  description: string;
  developer: string;
  publisher: string;
  platform_ids: string[];
  free: boolean;
  release_date: Date;
}

/**
 * Parse the GOG giveaway countdown (e.g. "47 : 59 : 12") into milliseconds.
 */
export function parseGogCountdown(text: string): number | null {
  const match = /(\d+)\s*:\s*(\d+)\s*:\s*(\d+)/.exec(text);
  if (!match) return null;

  const [hours = 0, minutes = 0, seconds = 0] = match.slice(1).map(Number);
  return hours * 3600000 + minutes * 60000 + seconds * 1000;
}

/**
 * Scrape GOG game details from the game page
 */
export async function scrapeGogGamePage(url: string): Promise<{
  gameTitle: string;
  isFree: boolean;
  countdownMs: number | null;
}> {
  log.info("Starting GOG game scraping...");

  const browser = await getBrowser();

  try {
    // Open game page
    const page = await newPage(browser);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    // Get game title
    let gameTitle = "";
    try {
      await page.waitForSelector(
        ".productcard-basics.hide-when-content-is-expanded",
      );
      gameTitle = await page.evaluate(() => {
        const textContainer = document.querySelector(
          ".productcard-basics.hide-when-content-is-expanded",
        );
        if (!textContainer) return "";
        const textElement = textContainer.querySelector(
          ".productcard-basics__title",
        );
        return textElement?.textContent ?? "";
      });
    } catch (error) {
      log.debug("Title not found", { error });
    }

    // Check if game is free
    let isFree = false;
    try {
      await page.waitForSelector(
        ".cart-button__state-giveaway span.cart-button__state-default",
      );
      isFree = await page.evaluate(() => {
        const textGiveaway = document.querySelector(
          ".cart-button__state-giveaway span.cart-button__state-default",
        );
        if (!textGiveaway) return false;
        return textGiveaway.textContent === "Go to giveaway";
      });
    } catch (error) {
      log.debug("Game couldn't be found to be free", { error });
    }

    // Get countdown timer if game is free
    let countdownMs = null;
    if (isFree) {
      const descPage = await newPage(browser);
      await descPage.goto("https://www.gog.com/#giveaway", {
        waitUntil: "domcontentloaded",
      });
      await delay(3000);

      try {
        await descPage.hover(".main-footer");
        await descPage.waitForSelector(".giveaway__countdown");
        const timeLeft = await descPage.evaluate(
          () => document.querySelector(".giveaway__countdown")?.textContent,
        );
        countdownMs = timeLeft ? parseGogCountdown(timeLeft) : null;
      } catch (error) {
        log.debug("Countdown timer not found", { error });
      }

      await descPage.close();
    }

    await page.close();

    return { gameTitle: gameTitle.trim(), isFree, countdownMs };
  } finally {
    await browser.close();
  }
}

/**
 * Search for a game in the GOG API
 */
export async function searchGogGame(gameTitle: string): Promise<{
  gameId: string;
  gameDetails: Partial<GogGameDetails>;
  isFree: boolean;
} | null> {
  try {
    const response = await fetch(
      `https://embed.gog.com/games/ajax/filtered?mediaType=game&search=${encodeURIComponent(gameTitle)}`,
    );
    const data = (await response.json()) as {
      totalGamesFound: number;
      products?: {
        title: string;
        id: number;
        price?: {
          discountPercentage: number;
        };
        supportedOperatingSystems: string[];
        image: string;
        releaseDate: number;
        developer: string;
        publisher: string;
      }[];
    };

    const product = data.products?.find(
      (product) => product.title === gameTitle,
    );
    if (!product) return null;

    return {
      gameId: product.id.toString(),
      isFree: product.price?.discountPercentage === 100,
      gameDetails: {
        name: product.title,
        cover: "https:" + product.image + ".jpg",
        cover_portrait: "https:" + product.image + ".jpg",
        developer: product.developer,
        publisher: product.publisher,
        platform_ids: normalizePlatformIds(product.supportedOperatingSystems),
        release_date: new Date(product.releaseDate * 1000),
      },
    };
  } catch (error) {
    log.error("Error searching GOG game", { error });
    return null;
  }
}

/**
 * Get game description from GOG API
 */
export async function getGogGameDescription(gameId: string): Promise<string> {
  try {
    const response = await fetch(
      `https://api.gog.com/products/${gameId}?expand=description,screenshots`,
    );
    const data = (await response.json()) as {
      description?: {
        full: string;
      };
      screenshots?: {
        url: string;
      }[];
    };

    return data.description?.full
      ? data.description.full
          .replace(/<[^>]+>/g, "") // Remove HTML tags
          .replace(/\n/g, " ") // Remove new lines
          .trim()
      : "";
  } catch (error) {
    log.error("Error fetching GOG game description", { error });
    return "";
  }
}

/**
 * Process a GOG game URL to get full details
 */
export async function processGogGame(gogUrl: string): Promise<{
  gameDetails: GogGameDetails;
  endDate: Date;
} | null> {
  try {
    // Scrape initial details from the game page
    const { gameTitle, isFree, countdownMs } = await scrapeGogGamePage(gogUrl);

    if (!gameTitle) {
      throw new Error("Could not find game title");
    }

    // Search for the game in GOG API
    const gameSearch = await searchGogGame(gameTitle);

    if (!gameSearch) {
      throw new Error("Game not found in GOG API");
    }

    // If the game is not free, return null
    if (!isFree && !gameSearch.isFree) {
      return null;
    }

    // Get game description
    const description = await getGogGameDescription(gameSearch.gameId);

    // Calculate end date
    const startDate = new Date();
    let endDate: Date;

    if (countdownMs) {
      endDate = new Date(startDate.getTime() + countdownMs);
    } else {
      // Default: 7 days from now
      endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    // Build complete game details
    const gameDetails: GogGameDetails = {
      ...(gameSearch.gameDetails as Omit<
        GogGameDetails,
        "description" | "free"
      >),
      description,
      free: true,
    };

    return { gameDetails, endDate };
  } catch (error) {
    log.error("Error processing GOG game", { error });
    return null;
  }
}
