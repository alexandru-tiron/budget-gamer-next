import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

interface PlayStationGameDetails {
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

// Interfaces for scraping results
interface GameMediaData {
  cache: Record<
    string,
    {
      name: string;
      media: Array<{
        role: string;
        url: string;
      }>;
    }
  >;
}

interface GameDetailsData {
  cache: Record<
    string,
    {
      descriptions: Array<{
        type: string;
        value: string;
      }>;
      releaseDate: string;
      publisherName: string;
      platforms: string[];
    }
  >;
}

interface GamePriceData {
  offers: {
    price: number;
  };
}

/**
 * Format a date to DD.MM.YYYY
 */
export function formatDate(date: string | number): string {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();

  return [day, month, year].join(".");
}

/**
 * Extract game IDs from PlayStation Store URLs
 */
export function extractPsGameIds(url: string): string[] {
  const psLinkRegex =
    /https:\/\/store\.playstation\.com\/([a-zA-Z]+(-[a-zA-Z]+)+)\/product\//gi;
  const gameLinksArray = url.split(",");
  const gameIds: string[] = [];

  for (const link of gameLinksArray) {
    const trimmedLink = link.trim();
    const id = trimmedLink.replace(psLinkRegex, "");
    if (id && id !== trimmedLink) {
      gameIds.push(id);
    }
  }

  return gameIds;
}

/**
 * Fetch game details from PlayStation Store API
 */
export async function fetchPsApiGameDetails(
  gameId: string,
): Promise<PlayStationGameDetails | null> {
  try {
    const response = await fetch(
      `https://store.playstation.com/store/api/chihiro/00_09_000/container/gb/en/999/${gameId}`,
    );
    // console.log(response.json());
    // If API request is successful
    if (response.ok) {
      const data = (await response.json()) as {
        name: string;
        cover: string;
        cover_portrait: string;
        description: string;
        developer: string;
        provider_name: string;
        playable_platform: string;
        default_sku: {
          price: number;
        };
        release_date: string;
        images: {
          url: string;
        }[];
        long_desc: string;
      };

      // Process images
      const imageRef = "https://image.api.playstation.com/";
      const appoloRef = "https://apollo2.dl.playstation.net/";
      const imagesArray = data.images || [];

      let cover = "";
      let coverPortrait = "";

      if (imagesArray.length > 1) {
        if (imagesArray[0]?.url?.includes(appoloRef)) {
          coverPortrait = imagesArray[0].url.replace(appoloRef, imageRef);
        } else {
          coverPortrait = imagesArray[0]?.url ?? "";
        }

        if (imagesArray[1]?.url?.includes(appoloRef)) {
          cover = imagesArray[1].url.replace(appoloRef, imageRef);
        } else {
          cover = imagesArray[1]?.url ?? "";
        }
      } else if (imagesArray.length === 1) {
        if (imagesArray[0]?.url?.includes(appoloRef)) {
          coverPortrait = imagesArray[0].url.replace(appoloRef, imageRef);
          cover = imagesArray[0].url.replace(appoloRef, imageRef);
        } else {
          coverPortrait = imagesArray[0]?.url ?? "";
          cover = imagesArray[0]?.url ?? "";
        }
      }

      // Clean description
      const description = data.long_desc?.replace(/<[^>]+>/g, "") ?? "";

      // Get platforms
      const platformIds = (data.playable_platform || [])
        .toString()
        .replace("™", "")
        .toLowerCase()
        .split(",");

      // Check if game is free
      const isFree = data.default_sku?.price === 0;

      // Format release date
      const releaseDate = new Date(data.release_date);

      return {
        name: data.name || "",
        cover,
        cover_portrait: coverPortrait,
        description,
        developer: data.provider_name || "",
        publisher: data.provider_name || "",
        platform_ids: platformIds,
        free: isFree,
        release_date: releaseDate,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching PlayStation game details from API:", error);
    return null;
  }
}

/**
 * Scrape game details from PlayStation Store website when API fails
 */
export async function scrapePsGameDetails(
  gameId: string,
): Promise<PlayStationGameDetails | null> {
  const options = {
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  };

  const browser = await puppeteerCore.launch(options);


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
    page.setDefaultNavigationTimeout(0);
    await page.goto(`https://store.playstation.com/en-gb/product/${gameId}/`);
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });
    await page.waitForSelector("script", { timeout: 2000 });

    // Extract media (images and game name)
    const gameMediaRaw = await page.evaluate(() => {
      const scriptTags = document.querySelectorAll("script");
      for (const scriptTag of Array.from(scriptTags)) {
        if (
          scriptTag.innerHTML.includes("media") &&
          scriptTag.innerHTML.includes("cache")
        ) {
          return JSON.parse(scriptTag.innerHTML) as GameMediaData;
        }
      }
      return null;
    });

    if (!gameMediaRaw) return null;

    // Extract game details (description, release date, publisher, platforms)
    const gameDetailsRaw = await page.evaluate(() => {
      const scriptTags = document.querySelectorAll("script");
      for (const scriptTag of Array.from(scriptTags)) {
        if (
          scriptTag.innerHTML.includes("Description") &&
          scriptTag.innerHTML.includes("cache")
        ) {
          try {
            return JSON.parse(scriptTag.innerHTML) as GameDetailsData;
          } catch (e) {
            console.log(e, "Error parsing game details");
            // Continue if parse fails
          }
        }
      }
      return null;
    });

    if (!gameDetailsRaw) {
      return null;
    }

    // Extract price information
    const gamePriceRaw = await page.evaluate(() => {
      const scriptTags = document.querySelectorAll("script");
      for (const scriptTag of Array.from(scriptTags)) {
        if (scriptTag.innerHTML.includes("price")) {
          try {
            return JSON.parse(scriptTag.innerHTML) as GamePriceData;
          } catch (e) {
            console.log(e, "Error parsing game price");
            // Continue if parse fails
          }
        }
      }
      return null;
    });

    if (!gamePriceRaw) {
      return null;
    }

    // Extract name and images
    const productKey = `Product:${gameId}`;

    const name = gameMediaRaw.cache[productKey]?.name ?? "";
    const imageLinks = gameMediaRaw.cache[productKey]?.media ?? [];

    let cover = "";
    let coverPortrait = "";

    for (const image of imageLinks) {
      if (image.role === "MASTER") {
        coverPortrait = image.url;
      }
      if (image.role === "GAMEHUB_COVER_ART") {
        cover = image.url;
      }
    }

    // If cover wasn't found, use cover_portrait as fallback
    if (!cover && coverPortrait) {
      cover = coverPortrait;
    }

    // Extract description
    let description = "";
    const descriptions = gameDetailsRaw.cache[productKey]?.descriptions ?? [];

    for (const desc of descriptions) {
      if (desc.type === "LONG") {
        description = desc.value.replace(/<[^>]+>/g, "");
        break;
      }
    }

    // Extract other details
    const releaseDate = new Date(
      gameDetailsRaw.cache[productKey]?.releaseDate ?? new Date().toISOString(),
    );
    const publisher = gameDetailsRaw.cache[productKey]?.publisherName ?? "";
    const platformIds = (gameDetailsRaw.cache[productKey]?.platforms ?? []).map(
      (p: string) => p.toLowerCase(),
    );

    // Check if game is free
    const price = gamePriceRaw.offers?.price ?? -1; // Default to -1 if price is undefined
    const isFree = price === 0;

    return {
      name,
      cover,
      cover_portrait: coverPortrait,
      description,
      developer: publisher, // Using publisher as developer since it's often the same
      publisher,
      platform_ids: platformIds,
      free: isFree,
      release_date: releaseDate,
    };
  } catch (error) {
    console.error("Error scraping PlayStation game details:", error);
    return null;
  } finally {
    await browser.close();
  }
}

/**
 * Process a PlayStation Store URL to get full game details
 */
export async function processPlayStationGame(psUrl: string): Promise<{
  gameDetails: PlayStationGameDetails;
  endDate: Date;
} | null> {
  try {
    // Extract game ID from URL
    const gameIds = extractPsGameIds(psUrl);

    if (gameIds.length === 0) {
      throw new Error("Could not extract game ID from URL");
    }

    // Get first game ID (we only process one game at a time)
    const gameId = gameIds[0];

    // Try fetching from API first
    let gameDetails = await fetchPsApiGameDetails(gameId ?? "");
    console.log(gameDetails);
    // If API fails, try scraping the website
    gameDetails ??= await scrapePsGameDetails(gameId ?? "");
    // If both methods fail or game is not free, return null
    if (!gameDetails) {
      return null;
    }

    // Calculate start date (1st of the current month)
    const startDate = new Date();
    startDate.setDate(1); // Set to the 1st of the month

    // Calculate end date (30 days from start date)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    return {
      gameDetails,
      endDate,
    };
  } catch (error) {
    console.error("Error processing PlayStation game:", error);
    return null;
  }
}
