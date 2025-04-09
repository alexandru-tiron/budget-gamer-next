import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { subscriptionGames } from "~/server/db/schema";

export const subscriptionGamesRouter = createTRPCRouter({

  createSubscriptionGame: publicProcedure
    .input(z.object({
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
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(subscriptionGames).values({
        name: input.name,
        cover: input.cover,
        cover_portrait: input.cover_portrait,
        description: input.description,
        developer: input.developer,
        start_date: input.start_date,
        end_date: input.end_date,
        platform_ids: input.platform_ids,
        provider_id: input.provider_id,
        provider_url: input.provider_url,
        publisher: input.publisher,
      });
    }),

  getAvailableGames: publicProcedure.query(async ({ ctx }) => {
    const subscriptionGames  = await ctx.db.query.subscriptionGames.findMany({
      where: (subscriptionGames, { lte, gte, and }) => and(lte(subscriptionGames.end_date, new Date()), gte(subscriptionGames.start_date, new Date())),
      orderBy: (subscriptionGames, { asc }) => [asc(subscriptionGames.end_date)],
    });
    return subscriptionGames ?? null;
  }),
});
