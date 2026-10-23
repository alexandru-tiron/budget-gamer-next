import { createTRPCRouter, internalProcedure } from "~/server/api/trpc";

import { fetchRedditArticles } from "../utils/url-helpers";
import { processArticleFromUrl } from "../services/article-service";
import { processAmazonPrimeGames } from "../utils/amazon-prime-helpers";
import { processEpicGames } from "../utils/epic-games-helpers";
import { processHumbleChoiceGames } from "../utils/humble-choice-helpers";
import { processPSPlusGames } from "../utils/ps-plus-helpers";
import { processNintendoGameTrials } from "../utils/nintendo-helpers";
import {
  processFreePlayDays,
  processGamePassAdditions,
  processXboxGiveaways,
} from "../utils/xbox-feeds";
import { TRPCError } from "@trpc/server";
import { logger } from "~/server/logger";

const log = logger.child({ scope: "scheduled" });

export const scheduledRouter = createTRPCRouter({
  getRedditArticles: internalProcedure.mutation(async ({ ctx }) => {
    try {
      // Fetch URLs from Reddit
      const urls = await fetchRedditArticles();

      // Track results
      const results = {
        total: urls.length,
        added: 0,
        failed: 0,
        errors: [] as string[],
      };

      // Process each URL
      for (const url of urls) {
        try {
          await processArticleFromUrl(ctx.db, url);
          results.added++;
        } catch (error) {
          results.failed++;
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          results.errors.push(`${url}: ${errorMessage}`);
        }
      }

      return results;
    } catch (error) {
      log.error("Error fetching Reddit articles", { error });
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch Reddit articles: ${errorMessage}`,
      });
    }
  }),

  getAmazonPrimeGames: internalProcedure.mutation(async ({ ctx }) => {
    try {
      // Process Amazon Prime games
      const results = await processAmazonPrimeGames(ctx.db);

      return results;
    } catch (error) {
      log.error("Error fetching Amazon Prime games", { error });
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch Amazon Prime games: ${errorMessage}`,
      });
    }
  }),

  getEpicFreeGames: internalProcedure.mutation(async ({ ctx }) => {
    try {
      // Process Epic Games
      const results = await processEpicGames(ctx.db);

      return results;
    } catch (error) {
      log.error("Error fetching Epic Games", { error });
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch Epic Games: ${errorMessage}`,
      });
    }
  }),

  getHumbleChoiceGames: internalProcedure.mutation(async ({ ctx }) => {
    try {
      // Process Humble Choice games
      const results = await processHumbleChoiceGames(ctx.db);

      return results;
    } catch (error) {
      log.error("Error fetching Humble Choice games", { error });
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch Humble Choice games: ${errorMessage}`,
      });
    }
  }),

  getPSPlusGames: internalProcedure.mutation(async ({ ctx }) => {
    try {
      // Process PlayStation Plus games
      const results = await processPSPlusGames(ctx.db);

      return results;
    } catch (error) {
      log.error("Error fetching PlayStation Plus games", { error });
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch PlayStation Plus games: ${errorMessage}`,
      });
    }
  }),

  getXboxGamePassGames: internalProcedure.mutation(({ ctx }) =>
    runFeed("Xbox Game Pass additions", () => processGamePassAdditions(ctx.db)),
  ),

  getXboxFreePlayDays: internalProcedure.mutation(({ ctx }) =>
    runFeed("Xbox Free Play Days", () => processFreePlayDays(ctx.db)),
  ),

  getXboxGiveaways: internalProcedure.mutation(({ ctx }) =>
    runFeed("Xbox giveaways", () => processXboxGiveaways(ctx.db)),
  ),

  getNintendoGameTrials: internalProcedure.mutation(({ ctx }) =>
    runFeed("Nintendo Switch Online Game Trials", () =>
      processNintendoGameTrials(ctx.db),
    ),
  ),
});

/**
 * Run a feed, turning a failure into an error the cron report can show.
 */
async function runFeed<T>(name: string, feed: () => Promise<T>): Promise<T> {
  try {
    return await feed();
  } catch (error) {
    log.error(`Error fetching ${name}`, { error });
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to fetch ${name}: ${errorMessage}`,
    });
  }
}
