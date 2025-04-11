import { getBrowser } from "./puppeteer-helper";

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

/**
 * Format a date to DD.MM.YYYY
 */
export function formatDate(date: string): string {
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
 * Extract app ID from a Steam URL
 */
export function extractSteamAppId(url: string): string | null {
  const appIdRegex = /app\/(\d+)/i;
  const match = appIdRegex.exec(url);

  return match?.[1] ?? null;
}

/**
 * Scrape end date from Steam store page
 */
export async function scrapeEndDate(steamUrl: string): Promise<number | null> {
  const browser = await getBrowser();

  try {
    if (!browser) {
      throw new Error("Browser not found");
    }
    const page = await browser.newPage();
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36",
    );

    await page.goto(steamUrl, { waitUntil: "domcontentloaded" });

    // Handle age verification if needed
    try {
      await page.hover(".agegate_birthday_selector");
      await page.select("select#ageYear", "1990");
      await page.click("a#view_product_page_btn");
      await delay(2000);
    } catch (error) {
      console.log(error, "Age verification not required or element not found");
      // Age verification not required or element not found
    }

    // Look for discount info
    try {
      await page.hover("#game_area_purchase");
      await page.waitForSelector(".game_purchase_discount_quantity", {
        timeout: 5000,
      });
    } catch (error) {
      console.log(error, "Discount info not found");
      // Discount info not found
      return null;
    }

    // Extract the end date text
    const endDateText = await page.evaluate(() => {
      const el = document.querySelector(".game_purchase_discount_quantity");
      return el ? el.textContent : null;
    });

    if (!endDateText) return null;

    // Parse different date formats
    let endDate: number | null = null;

    // Format: "Free to keep when you get it before Nov 7 @ 10:00am"
    const dateRegex1 = /before (\w+ \d+).*?@ (\d+:\d+[ap]m)/i;
    const match1 = dateRegex1.exec(endDateText);

    if (match1) {
      const dateStr = match1[1];
      const timeStr = match1[2];
      const year = new Date().getFullYear();
      const fullDateStr = `${dateStr}, ${year} ${timeStr}`;

      const date = new Date(fullDateStr);
      endDate = date.getTime();
    } else {
      // Format: "Free to keep when you get it before 7 November @ 10:00am"
      const dateRegex2 = /before (\d+) (\w+).*?@ (\d+:\d+)([ap]m)/i;
      const match2 = dateRegex2.exec(endDateText);

      if (match2) {
        const day = match2[1];
        const month = match2[2];
        const time = match2[3];
        const ampm = match2[4];

        const year = new Date().getFullYear();
        const fullDateStr = `${day} ${month} ${year} ${time}${ampm}`;

        const date = new Date(fullDateStr);
        endDate = date.getTime();
      }
    }

    return endDate;
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
      `http://store.steampowered.com/api/appdetails?appids=${appId}`,
    );
    const data = (await response.json()) as SteamApiResponse;

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
      releaseDate = new Date(gameData.release_date.date);
    }

    return {
      name: gameData.name,
      cover: gameData.header_image,
      cover_portrait: gameData.screenshots?.[0]?.path_full ?? "",
      description: gameData.short_description ?? "",
      developer: gameData.developers?.[0] ?? "",
      publisher: gameData.publishers?.[0] ?? "",
      platform_ids: platformIds,
      free: gameData.is_free ?? false,
      discount_percent: discountPercent,
      release_date: releaseDate,
    };
  } catch (error) {
    console.error("Error fetching Steam game details:", error);
    return null;
  }
}
