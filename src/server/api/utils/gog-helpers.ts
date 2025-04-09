import puppeteer from "puppeteer";

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
 * Format a date to DD.MM.YYYY
 */
export function formatDate(date: number): string {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();

  return [day, month, year].join(".");
}

/**
 * Delay execution for a specified time
 */
function delay(time: number): Promise<void> {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

/**
 * Scrape GOG game details from the game page
 */
export async function scrapeGogGamePage(url: string): Promise<{
  gameTitle: string;
  isFree: boolean;
  countdownMs: number | null;
}> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    // Open game page
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36",
    );
    page.setDefaultNavigationTimeout(0);
    await page.goto(url);
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
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
      console.log(error, "Title not found");
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
      console.log(error, "Game couldn't be found to be free");
    }

    // Get countdown timer if game is free
    let countdownMs = null;
    if (isFree) {
      const descPage = await browser.newPage();
      await descPage.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      });
      await descPage.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36",
      );
      await descPage.goto("https://www.gog.com/#giveaway", {
        waitUntil: "domcontentloaded",
      });
      await delay(3000);

      try {
        await descPage.hover(".main-footer");
        await descPage.waitForSelector(".giveaway__countdown");
        countdownMs = await descPage.evaluate(() => {
          const timeLeftEl = document.querySelector(".giveaway__countdown");
          if (!timeLeftEl?.textContent) return null;

          const timeLeft = timeLeftEl.textContent;
          const hour = parseInt(timeLeft.slice(0, 2));
          const minutes = parseInt(timeLeft.slice(5, 7));
          const seconds = parseInt(timeLeft.slice(10, 12));
          return hour * 3600000 + minutes * 60000 + seconds * 1000;
        });
      } catch (error) {
        console.log(error, "Countdown timer not found");
      }

      await descPage.close();
    }

    await page.close();

    return { gameTitle, isFree, countdownMs };
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
    const data = await response.json() as {
      totalGamesFound: number;
      products: {
        title: string;
        id: number;
        price: {
          discountPercentage: number;
        };
        supportedOperatingSystems: string[];
        image: string;
        releaseDate: number;
        developer: string;
        publisher: string;
      }[];
    };

    const gamesFound = data.totalGamesFound || 0;

    for (let i = 0; i < gamesFound; i++) {
      const product = data.products[i];
      if (product?.title === gameTitle) {
        const gameId = product.id.toString();

        const isFree = product.price?.discountPercentage === 100;

        // Format platforms
        const platforms = [...product.supportedOperatingSystems];
        const macIndex = platforms.indexOf("mac");
        if (macIndex !== -1) {
          platforms[macIndex] = "mac_os";
        }

        return {
          gameId,
          isFree,
          gameDetails: {
            name: product.title,
            cover: "https:" + product.image + ".jpg",
            cover_portrait: "https:" + product.image + ".jpg",
            developer: product.developer,
            publisher: product.publisher,
            platform_ids: platforms,
            release_date: new Date(product.releaseDate * 1000),
          },
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error searching GOG game:", error);
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
    const data = await response.json() as {
      description: {
        full: string;
      };
      screenshots: {
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
    console.error("Error fetching GOG game description:", error);
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
    console.error("Error processing GOG game:", error);
    return null;
  }
}
