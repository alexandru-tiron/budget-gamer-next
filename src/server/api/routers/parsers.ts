import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  internalProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  extractSteamAppId,
  scrapeEndDate,
  fetchSteamGameDetails,
} from "../utils/steam-helpers";
import { processGogGame } from "../utils/gog-helpers";
import { processHumbleGame } from "../utils/humble-helpers";
import { processPlayStationGame } from "../utils/playstation-helpers";
import { createFreeGame } from "../services/freeGames-service";

export const parsersRouter = createTRPCRouter({
  // Internal procedure for processing Steam games
  processSteamGame: internalProcedure
    .input(
      z.object({
        steamUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Extract app ID from URL
        const appId = extractSteamAppId(input.steamUrl);
        if (!appId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid Steam URL format",
          });
        }

        // Check if game already exists
        const existingGame = await ctx.db.query.freeGames.findFirst({
          where: (games, { eq }) => eq(games.provider_url, input.steamUrl),
        });

        if (existingGame) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Game already exists",
          });
        }

        // Get end date from scraping the Steam page
        const endDateTimestamp = await scrapeEndDate(input.steamUrl);

        // Fetch game details from Steam API
        const gameDetails = await fetchSteamGameDetails(appId);

        if (!gameDetails) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Failed to fetch game details",
          });
        }

        // Only process games with 100% discount
        if (gameDetails.discount_percent !== 100) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Game is not 100% off",
          });
        }

        // Prepare game data
        const startDate = new Date();
        let endDate: Date;

        if (endDateTimestamp) {
          endDate = new Date(endDateTimestamp);
        } else {
          // Default: 4 days from now if no end date found
          endDate = new Date();
          endDate.setDate(endDate.getDate() + 4);
        }

        // Create the game
        await createFreeGame(ctx.db, {
          ...gameDetails,
          start_date: startDate,
          end_date: endDate,
          provider_id: "steam",
          provider_url: input.steamUrl,
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Error processing Steam game:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process Steam game",
        });
      }
    }),

  // Internal procedure for processing GOG games
  processGogGame: internalProcedure
    .input(
      z.object({
        gogUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if game already exists
        const existingGame = await ctx.db.query.freeGames.findFirst({
          where: (games, { eq }) => eq(games.provider_url, input.gogUrl),
        });

        if (existingGame) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Game already exists",
          });
        }

        // Process GOG game
        const result = await processGogGame(input.gogUrl);

        if (!result) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Game is not free or couldn't be processed",
          });
        }

        const { gameDetails, endDate } = result;
        const startDate = new Date();

        // Create the game
        await createFreeGame(ctx.db, {
          name: gameDetails.name,
          cover: gameDetails.cover,
          cover_portrait: gameDetails.cover_portrait,
          description: gameDetails.description,
          developer: gameDetails.developer,
          publisher: gameDetails.publisher,
          platform_ids: gameDetails.platform_ids,
          free: gameDetails.free,
          start_date: startDate,
          end_date: endDate,
          provider_id: "gog",
          provider_url: input.gogUrl,
          release_date: gameDetails.release_date,
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Error processing GOG game:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process GOG game",
        });
      }
    }),

  // Internal procedure for processing Humble Bundle games
  processHumbleGame: internalProcedure
    .input(
      z.object({
        humbleUrl: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if game already exists
        const existingGame = await ctx.db.query.freeGames.findFirst({
          where: (games, { eq }) => eq(games.provider_url, input.humbleUrl),
        });

        if (existingGame) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Game already exists",
          });
        }

        // Process Humble Bundle game
        const result = await processHumbleGame(input.humbleUrl);

        if (!result) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Game is not free or couldn't be processed",
          });
        }

        const { gameDetails, endDate } = result;
        const startDate = new Date();

        // Create the game
        await createFreeGame(ctx.db, {
          name: gameDetails.name,
          cover: gameDetails.cover,
          cover_portrait: gameDetails.cover_portrait,
          description: gameDetails.description,
          developer: gameDetails.developer,
          publisher: gameDetails.publisher,
          platform_ids: gameDetails.platform_ids,
          free: gameDetails.free,
          start_date: startDate,
          end_date: endDate,
          provider_id: "humble_bundle",
          provider_url: input.humbleUrl,
          release_date: new Date(), // Using current date as Humble doesn't provide release dates
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Error processing Humble Bundle game:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process Humble Bundle game",
        });
      }
    }),

  // Internal procedure for processing PlayStation Store games
  processPlayStationGame: internalProcedure
    .input(
      z.object({
        psUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if game already exists
        const existingGame = await ctx.db.query.freeGames.findFirst({
          where: (games, { eq }) => eq(games.provider_url, input.psUrl),
        });

        if (existingGame) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Game already exists",
          });
        }

        // Process PlayStation Store game
        const result = await processPlayStationGame(input.psUrl);

        if (!result) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Game is not free or couldn't be processed",
          });
        }

        const { gameDetails, endDate } = result;
        const startDate = new Date();

        // Create the game
        await createFreeGame(ctx.db, {
          name: gameDetails.name,
          cover: gameDetails.cover,
          cover_portrait: gameDetails.cover_portrait,
          description: gameDetails.description,
          developer: gameDetails.developer,
          publisher: gameDetails.publisher,
          platform_ids: gameDetails.platform_ids,
          free: gameDetails.free,
          start_date: startDate,
          end_date: endDate,
          provider_id: "playstation",
          provider_url: input.psUrl,
          release_date: gameDetails.release_date,
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Error processing PlayStation game:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process PlayStation game",
        });
      }
    }),

  // Public procedure for validating and adding PlayStation Store games
  validateAndAddPlayStationGame: publicProcedure
    .input(
      z.object({
        psUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if game already exists
        const existingGame = await ctx.db.query.freeGames.findFirst({
          where: (games, { eq }) => eq(games.provider_url, input.psUrl),
        });

        if (existingGame) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Game already exists",
          });
        }

        // Process PlayStation Store game
        const result = await processPlayStationGame(input.psUrl);

        if (!result) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Game is not free or couldn't be processed",
          });
        }

        const { gameDetails, endDate } = result;
        const startDate = new Date();

        // Create the game
        await createFreeGame(ctx.db, {
          name: gameDetails.name,
          cover: gameDetails.cover,
          cover_portrait: gameDetails.cover_portrait,
          description: gameDetails.description,
          developer: gameDetails.developer,
          publisher: gameDetails.publisher,
          platform_ids: gameDetails.platform_ids,
          free: gameDetails.free,
          start_date: startDate,
          end_date: endDate,
          provider_id: "playstation",
          provider_url: input.psUrl,
          release_date: gameDetails.release_date,
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Error processing PlayStation game:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process PlayStation game",
        });
      }
    }),

  // Public procedure for validating and adding Humble Bundle games
  validateAndAddHumbleGame: publicProcedure
    .input(
      z.object({
        humbleUrl: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if game already exists
        const existingGame = await ctx.db.query.freeGames.findFirst({
          where: (games, { eq }) => eq(games.provider_url, input.humbleUrl),
        });

        if (existingGame) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Game already exists",
          });
        }

        // Process Humble Bundle game
        const result = await processHumbleGame(input.humbleUrl);

        if (!result) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Game is not free or couldn't be processed",
          });
        }

        const { gameDetails, endDate } = result;
        const startDate = new Date();

        // Create the game
        await createFreeGame(ctx.db, {
          name: gameDetails.name,
          cover: gameDetails.cover,
          cover_portrait: gameDetails.cover_portrait,
          description: gameDetails.description,
          developer: gameDetails.developer,
          publisher: gameDetails.publisher,
          platform_ids: gameDetails.platform_ids,
          free: gameDetails.free,
          start_date: startDate,
          end_date: endDate,
          provider_id: "humble_bundle",
          provider_url: input.humbleUrl,
          release_date: new Date(), // Using current date as Humble doesn't provide release dates
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Error processing Humble Bundle game:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process Humble Bundle game",
        });
      }
    }),

  // Public procedure for validating and adding GOG games
  validateAndAddGogGame: publicProcedure
    .input(
      z.object({
        gogUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if game already exists
        const existingGame = await ctx.db.query.freeGames.findFirst({
          where: (games, { eq }) => eq(games.provider_url, input.gogUrl),
        });

        if (existingGame) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Game already exists",
          });
        }

        // Process GOG game
        const result = await processGogGame(input.gogUrl);

        if (!result) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Game is not free or couldn't be processed",
          });
        }

        const { gameDetails, endDate } = result;
        const startDate = new Date();

        // Create the game
        await createFreeGame(ctx.db, {
          name: gameDetails.name,
          cover: gameDetails.cover,
          cover_portrait: gameDetails.cover_portrait,
          description: gameDetails.description,
          developer: gameDetails.developer,
          publisher: gameDetails.publisher,
          platform_ids: gameDetails.platform_ids,
          free: gameDetails.free,
          start_date: startDate,
          end_date: endDate,
          provider_id: "gog",
          provider_url: input.gogUrl,
          release_date: gameDetails.release_date,
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Error processing GOG game:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process GOG game",
        });
      }
    }),
});
