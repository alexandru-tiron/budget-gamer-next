import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  createSubscriptionGame,
  getAvailableSubscriptionGames,
} from "../services/subscriptionGames-service";

export const subscriptionGamesRouter = createTRPCRouter({
  createSubscriptionGame: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        cover: z.string().min(1),
        cover_portrait: z.string().min(1),
        description: z.string().min(1),
        developer: z.string().min(1),
        start_date: z.date(),
        end_date: z.date(),
        platform_ids: z.array(z.string()),
        provider_id: z.string(),
        provider_url: z.string(),
        publisher: z.string(),
        release_date: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await createSubscriptionGame(ctx.db, { ...input });
    }),

  getSubscriptionGames: publicProcedure.query(async ({ ctx }) => {
    return getAvailableSubscriptionGames(ctx.db);
  }),
});
