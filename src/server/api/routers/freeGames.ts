import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  internalProcedure,
} from "~/server/api/trpc";
import {
  createFreeGame,
  getAvailableFreeGames,
} from "../services/freeGames-service";
import { processGameLink } from "../services/game-link-service";

export const freeGamesRouter = createTRPCRouter({
  createFreeGame: internalProcedure
    .input(
      z.object({
        name: z.string().min(1),
        cover: z.string().min(1),
        cover_portrait: z.string().min(1),
        description: z.string().min(1),
        developer: z.string().min(1),
        start_date: z.date(),
        end_date: z.date(),
        free: z.boolean(),
        platform_ids: z.array(z.string()),
        provider_id: z.string(),
        provider_url: z.string().url(),
        publisher: z.string(),
        release_date: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await createFreeGame(ctx.db, { ...input });
    }),

  getAvailableGames: publicProcedure.query(async ({ ctx }) => {
    return getAvailableFreeGames(ctx.db);
  }),

  // Public procedure - only adds games that are verified to be free on their store
  validateGameLink: publicProcedure
    .input(
      z.object({
        link: z.string().url().max(2048),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return processGameLink(input.link, ctx.db);
    }),
});
