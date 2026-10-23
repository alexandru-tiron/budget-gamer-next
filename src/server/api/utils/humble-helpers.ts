import { normalizePlatformIds } from "./platforms";
import { getBrowser, newPage } from "./puppeteer-helper";
import { logger } from "~/server/logger";

const log = logger.child({ scope: "humble" });

interface HumbleGameDetails {
  name: string;
  cover: string;
  cover_portrait: string;
  description: string;
  developer: string;
  publisher: string;
  platform_ids: string[];
  free: boolean;
  provider_url?: string; // Added to support return value
}

// Humble Bundle API response interfaces
interface HumbleApiResponse {
  result?: HumbleGameResult[];
}

interface HumbleGameResult {
  human_name?: string;
  large_capsule?: string;
  description?: string;
  developers?: Array<{ "developer-name": string }>;
  publishers?: Array<{ "publisher-name": string }>;
  platforms?: string[];
  current_price?: { amount: number };
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
  const browser = await getBrowser();

  try {
    const page = await newPage(browser);

    // Navigate to the API endpoint with the game IDs and read the raw JSON body
    const apiUrl = `https://www.humblebundle.com/store/api/lookup?products%5B%5D=${gameIds}&request=1&edit_mode=false`;
    const response = await page.goto(apiUrl);

    if (!response?.ok()) {
      throw new Error("Failed to fetch Humble Bundle game data");
    }

    const apiResponse = (await response.json()) as HumbleApiResponse | null;

    if (!apiResponse?.result?.[0]) {
      throw new Error("Invalid Humble Bundle API response");
    }

    const game = apiResponse.result[0];

    // Check if the game is free
    const isFree = game.current_price?.amount === 0;

    if (!isFree) {
      return null;
    }

    // Format the description by removing HTML tags
    const description = game.description?.replace(/<[^>]+>/g, "") ?? "";

    return {
      name: game.human_name ?? "",
      cover: game.large_capsule ?? "",
      cover_portrait: game.large_capsule ?? "",
      description,
      developer: game.developers?.[0]?.["developer-name"] ?? "",
      publisher: game.publishers?.[0]?.["publisher-name"] ?? "",
      platform_ids: normalizePlatformIds(game.platforms ?? []),
      free: true,
    };
  } catch (error) {
    log.error("Error fetching Humble Bundle game details", { error });
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
    log.error("Error processing Humble Bundle game", { error });
    return null;
  }
}
