import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

import { fetchRedditArticles } from "../utils/url-helpers";
import { processArticleFromUrl } from "../services/article-service";
import { processAmazonPrimeGames } from "../utils/amazon-prime-helpers";
import { processEpicGames } from "../utils/epic-games-helpers";
import { processHumbleChoiceGames } from "../utils/humble-choice-helpers";
import { processPSPlusGames } from "../utils/ps-plus-helpers";
import { TRPCError } from "@trpc/server";

export const scheduledRouter = createTRPCRouter({
  getRedditArticles: publicProcedure.mutation(async ({ ctx }) => {
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
      console.error("Error fetching Reddit articles:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch Reddit articles: ${errorMessage}`,
      });
    }
  }),

  getAmazonPrimeGames: publicProcedure.mutation(async ({ ctx }) => {
    try {
      // Process Amazon Prime games
      const results = await processAmazonPrimeGames(ctx.db);

      return results;
    } catch (error) {
      console.error("Error fetching Amazon Prime games:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch Amazon Prime games: ${errorMessage}`,
      });
    }
  }),

  getEpicFreeGames: publicProcedure.mutation(async ({ ctx }) => {
    try {
      // Process Epic Games
      const results = await processEpicGames(ctx.db);

      return results;
    } catch (error) {
      console.error("Error fetching Epic Games:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch Epic Games: ${errorMessage}`,
      });
    }
  }),

  getHumbleChoiceGames: publicProcedure.mutation(async ({ ctx }) => {
    try {
      // Process Humble Choice games
      const results = await processHumbleChoiceGames(ctx.db);

      return results;
    } catch (error) {
      console.error("Error fetching Humble Choice games:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch Humble Choice games: ${errorMessage}`,
      });
    }
  }),

  getPSPlusGames: publicProcedure.mutation(async ({ ctx }) => {
    try {
      // Process PlayStation Plus games
      const results = await processPSPlusGames(ctx.db);

      return results;
    } catch (error) {
      console.error("Error fetching PlayStation Plus games:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch PlayStation Plus games: ${errorMessage}`,
      });
    }
  }),
});
