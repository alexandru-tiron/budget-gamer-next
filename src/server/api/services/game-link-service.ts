import { TRPCError } from "@trpc/server";
import type { db } from "~/server/db";
import { createFreeGame } from "./freeGames-service";
import {
  extractSteamAppId,
  fetchSteamGameDetails,
  scrapeEndDate,
} from "../utils/steam-helpers";
import { processPlayStationGame } from "../utils/playstation-helpers";
import { processHumbleGame } from "../utils/humble-helpers";
import { processGogGame } from "../utils/gog-helpers";

// URL validation patterns
export const urlValidation =
  /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)/gi;
export const steamLinkValidation = /store\.steampowered\.com\/app\/[0-9]+\//g;
export const epicGamesLinkValidation =
  /store\.epicgames\.com\/([a-zA-Z]+(-[a-zA-Z]+))+\/.*\//g;
export const playstationLinkValidation =
  /store\.playstation\.com\/([a-zA-Z]+(-[a-zA-Z]+)+)\/product\/.*/g;
export const humbleBundleLinkValidation = /humblebundle\.com\/store\/.*/g;
export const gogLinkValidation = /gog\.com\/.*\/game\/.*/g;
export const gogLinkValidationAlt = /gog\.com\/game\/.*/g;

// Helper function to check if a URL matches a regex pattern
export function doesLinkMatchRegExp(url: string, regexp: RegExp): boolean {
  return regexp.test(url);
}

/**
 * Process a game link based on its type
 */
export async function processGameLink(
  link: string,
  dbInstance: typeof db,
): Promise<{ success: boolean; provider: string }> {
  // Check if the link is a valid URL
  if (!doesLinkMatchRegExp(link, urlValidation)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid URL format",
    });
  }

  // Process the link based on its type
  if (doesLinkMatchRegExp(link, steamLinkValidation)) {
    // Process Steam game
    try {
      // Extract app ID from URL
      const appId = extractSteamAppId(link);
      if (!appId) {
        throw new Error("Could not extract Steam app ID");
      }

      // Fetch game details from Steam API
      const gameDetails = await fetchSteamGameDetails(appId);
      if (!gameDetails) {
        throw new Error("Could not fetch Steam game details");
      }

      // Get end date from scraping the Steam page
      const endDateTimestamp = await scrapeEndDate(link);

      // Create the game in the database
      await createFreeGame(dbInstance, {
        ...gameDetails,
        start_date: new Date(),
        end_date: endDateTimestamp
          ? new Date(endDateTimestamp)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        provider_id: appId,
        provider_url: link,
      });

      return { success: true, provider: "steam" };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to process Steam game: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  } else if (doesLinkMatchRegExp(link, epicGamesLinkValidation)) {
    // Epic Games not supported yet
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Epic Games links are not supported yet",
    });
  } else if (doesLinkMatchRegExp(link, playstationLinkValidation)) {
    // Process PlayStation game
    try {
      await processPlayStationGame(link);
      return { success: true, provider: "playstation" };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to process PlayStation game: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  } else if (doesLinkMatchRegExp(link, humbleBundleLinkValidation)) {
    // Process Humble Bundle game
    try {
      await processHumbleGame(link);
      return { success: true, provider: "humble" };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to process Humble Bundle game: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  } else if (
    doesLinkMatchRegExp(link, gogLinkValidation) ||
    doesLinkMatchRegExp(link, gogLinkValidationAlt)
  ) {
    // Process GOG game
    try {
      await processGogGame(link);
      return { success: true, provider: "gog" };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to process GOG game: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  } else {
    // Unsupported link type
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Unsupported game link type",
    });
  }
}
