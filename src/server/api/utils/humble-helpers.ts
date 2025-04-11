import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

interface HumbleGameDetails {
  name: string;
  cover: string;
  cover_portrait: string;
  description: string;
  developer: string;
  publisher: string;
  platform_ids: string[];
  free: boolean;
  release_date: string;
  provider_url?: string; // Added to support return value
}

// Humble Bundle API response interfaces
interface HumbleApiResponse {
  result: HumbleGameResult[];
}

interface HumbleGameResult {
  human_name: string;
  large_capsule: string;
  description: string;
  developers: Array<{ "developer-name": string }>;
  publishers: Array<{ "publisher-name": string }>;
  platforms: string[];
  current_price: { amount: number };
}

/**
 * Extract game IDs from Humble Bundle URLs
 */
export function extractHumbleGameIds(urls: string): {
  gameIds: string;
  firstUrl: string;
} {
  const humbleLinkRegex =
    /https:\/\/www\.humblebundle\.com\/store\/([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*)/gi;
  const humbleIdRegex = /https:\/\/www\.humblebundle\.com\/store\//gi;

  const gameLinksArray = urls.split(",");
  let gameIds = "";

  if (gameLinksArray.length === 0) {
    return { gameIds: "", firstUrl: "" };
  }

  for (let i = 0; i < gameLinksArray.length; i++) {
    const link = gameLinksArray[i]?.trim() ?? "";
    const matches = [...link.matchAll(humbleLinkRegex)];

    if (matches.length > 0 && matches[0]?.[0]) {
      const validLink = matches[0][0];
      const id = validLink.replace(humbleIdRegex, "");

      if (i === 0) {
        gameIds = id;
      } else {
        gameIds += "," + id;
      }
    }
  }

  return {
    gameIds,
    firstUrl: gameLinksArray[0]?.trim() ?? "",
  };
}

/**
 * Fetch Humble Bundle game details using Puppeteer
 */
export async function fetchHumbleGameDetails(
  gameIds: string,
): Promise<HumbleGameDetails | null> {
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
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36",
    );
    page.setDefaultNavigationTimeout(0);

    // Navigate to the API endpoint with the game IDs
    const apiUrl = `https://www.humblebundle.com/store/api/lookup?products%5B%5D=${gameIds}&request=1&edit_mode=false`;
    await page.goto(apiUrl);
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });
    await page.waitForSelector("*");

    // Extract the JSON data from the page
    const jsonText = await page.evaluate(() => {
      const element = document.querySelector("*");
      return element ? (element.textContent ?? null) : null;
    });

    if (!jsonText) {
      throw new Error("Failed to fetch Humble Bundle game data");
    }

    const apiResponse = JSON.parse(jsonText) as HumbleApiResponse;

    if (!apiResponse?.result?.[0]) {
      throw new Error("Invalid Humble Bundle API response");
    }

    const game = apiResponse.result[0];

    // Check if the game is free
    const isFree = game.current_price?.amount === 0;

    if (!isFree) {
      return null;
    }

    // Extract platforms
    const platforms = game.platforms ?? [];

    // Format the description by removing HTML tags
    const description = game.description?.replace(/<[^>]+>/g, "") ?? "";

    return {
      name: game.human_name ?? "",
      cover: game.large_capsule ?? "",
      cover_portrait: game.large_capsule ?? "",
      description,
      developer: game.developers?.[0]?.["developer-name"] ?? "",
      publisher: game.publishers?.[0]?.["publisher-name"] ?? "",
      platform_ids: platforms,
      free: true,
      release_date: "", // Humble Bundle doesn't provide release dates consistently
    };
  } catch (error) {
    console.error("Error fetching Humble Bundle game details:", error);
    return null;
  } finally {
    await browser.close();
  }
}

/**
 * Process a Humble Bundle game URL to get full details
 */
export async function processHumbleGame(humbleUrl: string): Promise<{
  gameDetails: HumbleGameDetails;
  endDate: Date;
} | null> {
  try {
    // Extract game IDs from the URL(s)
    const { gameIds, firstUrl } = extractHumbleGameIds(humbleUrl);

    if (!gameIds) {
      throw new Error("Could not extract game ID from URL");
    }

    // Fetch game details
    const gameDetails = await fetchHumbleGameDetails(gameIds);

    if (!gameDetails) {
      return null; // Game is not free
    }

    // Calculate dates
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    return {
      gameDetails: {
        ...gameDetails,
        provider_url: firstUrl,
      },
      endDate,
    };
  } catch (error) {
    console.error("Error processing Humble Bundle game:", error);
    return null;
  }
}
