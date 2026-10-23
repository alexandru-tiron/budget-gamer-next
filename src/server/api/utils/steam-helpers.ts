import { normalizePlatformIds } from "./platforms";
import { delay, getBrowser, newPage } from "./puppeteer-helper";
import { monthIndex, PACIFIC_TIME_ZONE, zonedTimeToUtc } from "./time";
import { logger } from "~/server/logger";

const log = logger.child({ scope: "steam" });

interface SteamGameDetails {
  name: string;
  cover: string;
  cover_portrait: string;
  description: string;
  developer: string;
  publisher: string;
  platform_ids: string[];
  free: boolean;
  discount_percent: number;
  release_date: Date;
}

// Steam API response interfaces
type SteamApiResponse = Record<
  string,
  {
    success: boolean;
    data?: SteamGameData;
  }
>;

interface SteamGameData {
  name: string;
  header_image: string;
  screenshots?: { path_full: string }[];
  short_description?: string;
  developers?: string[];
  publishers?: string[];
  platforms?: {
    windows?: boolean;
    mac?: boolean;
    linux?: boolean;
  };
  is_free?: boolean;
  price_overview?: {
    discount_percent: number;
  };
  package_groups?: {
    subs?: {
      percent_savings_text?: string;
    }[];
  }[];
  release_date?: {
    date?: string;
  };
}

// Steam shows promotion end times in Pacific time
const STEAM_TIME_ZONE = PACIFIC_TIME_ZONE;

/**
 * Extract app ID from a Steam URL
 */
export function extractSteamAppId(url: string): string | null {
  const appIdRegex = /app\/(\d+)/i;
  const match = appIdRegex.exec(url);

  return match?.[1] ?? null;
}

/**
 * Parse the end of a Steam "free to keep" promotion, e.g.
 * "Free to keep when you get it before Nov 7 @ 10:00am." or "... before 7 Nov @ 10:00am."
 * The text has no year, so a date that already passed is assumed to be next year's.
 */
export function parseSteamEndDate(
  text: string,
  now: Date = new Date(),
): number | null {
  const monthFirst = /before (\p{L}+)\.? (\d{1,2})\b/iu.exec(text);
  const dayFirst = /before (\d{1,2}) (\p{L}+)/iu.exec(text);
  const time = /@ ?(\d{1,2}):(\d{2}) ?([ap])\.?m/i.exec(text);

  const monthName = monthFirst?.[1] ?? dayFirst?.[2];
  const dayText = monthFirst?.[2] ?? dayFirst?.[1];
  if (!monthName || !dayText || !time) return null;

  const month = monthIndex(monthName);
  if (month === -1) return null;

  const day = Number(dayText);
  const hours =
    (Number(time[1]) % 12) + (time[3]?.toLowerCase() === "p" ? 12 : 0);
  const minutes = Number(time[2]);

  const year = now.getUTCFullYear();
  let endDate = zonedTimeToUtc(
    year,
    month,
    day,
    hours,
    minutes,
    STEAM_TIME_ZONE,
  );

  // e.g. scraped on Dec 30 for a promotion ending Jan 2
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  if (endDate < now.getTime() - weekMs) {
    endDate = zonedTimeToUtc(
      year + 1,
      month,
      day,
      hours,
      minutes,
      STEAM_TIME_ZONE,
    );
  }

  return endDate;
}

/**
 * Scrape end date from Steam store page
 */
export async function scrapeEndDate(steamUrl: string): Promise<number | null> {
  const browser = await getBrowser();

  try {
    const page = await newPage(browser);
    await page.goto(steamUrl, { waitUntil: "domcontentloaded" });

    // Handle age verification if needed
    try {
      await page.hover(".agegate_birthday_selector");
      await page.select("select#ageYear", "1990");
      await page.click("a#view_product_page_btn");
      await delay(2000);
    } catch {
      // Age verification not required or element not found
    }

    // Look for discount info
    try {
      await page.hover("#game_area_purchase");
      await page.waitForSelector(".game_purchase_discount_quantity", {
        timeout: 5000,
      });
    } catch (error) {
      log.debug("Discount info not found", { error });
      return null;
    }

    // Extract the end date text
    const endDateText = await page.evaluate(() => {
      const el = document.querySelector(".game_purchase_discount_quantity");
      return el ? el.textContent : null;
    });

    return endDateText ? parseSteamEndDate(endDateText) : null;
  } finally {
    await browser.close();
  }
}

/**
 * Fetch game details from Steam API
 */
export async function fetchSteamGameDetails(
  appId: string,
): Promise<SteamGameDetails | null> {
  try {
    const response = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}`,
    );
    const data = (await response.json()) as SteamApiResponse | null;

    if (!data?.[appId]?.success) {
      return null;
    }

    const gameData = data[appId].data;
    if (!gameData) return null;

    // Get discount percentage
    let discountPercent = 0;

    if (gameData.price_overview) {
      discountPercent = gameData.price_overview.discount_percent;
    } else if (gameData.package_groups?.[0]?.subs?.[0]?.percent_savings_text) {
      const savingsText =
        gameData.package_groups[0].subs[0].percent_savings_text;
      const numericStr = savingsText.replace(/[^0-9.-]+/g, "");
      discountPercent = Math.abs(parseFloat(numericStr));
    }

    // Build platform IDs
    const platformIds: string[] = [];
    if (gameData.platforms) {
      if (gameData.platforms.windows) platformIds.push("windows");
      if (gameData.platforms.mac) platformIds.push("mac");
      if (gameData.platforms.linux) platformIds.push("linux");
    }

    // Format release date
    let releaseDate = new Date();
    if (gameData.release_date?.date) {
      const parsed = new Date(gameData.release_date.date);
      if (!Number.isNaN(parsed.getTime())) releaseDate = parsed;
    }

    return {
      name: gameData.name,
      cover: gameData.header_image,
      cover_portrait: gameData.screenshots?.[0]?.path_full ?? "",
      description: gameData.short_description ?? "",
      developer: gameData.developers?.[0] ?? "",
      publisher: gameData.publishers?.[0] ?? "",
      platform_ids: normalizePlatformIds(platformIds),
      free: gameData.is_free ?? false,
      discount_percent: discountPercent,
      release_date: releaseDate,
    };
  } catch (error) {
    log.error("Error fetching Steam game details", { error });
    return null;
  }
}
