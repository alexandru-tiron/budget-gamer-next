import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  publicProcedure,
  internalProcedure,
} from "~/server/api/trpc";

import { URL_PATTERN } from "../utils/url-helpers";
import {
  createArticle,
  getAvailableArticles,
  processArticleFromUrl,
  type ArticleCreateInput,
} from "../services/article-service";

// Create the router with procedures
export const articlesRouter = createTRPCRouter({
  // Public procedure - get all available articles
  getAvailableArticles: publicProcedure.query(async ({ ctx }) => {
    return getAvailableArticles(ctx.db);
  }),  

  // Internal procedure - create an article directly
  createArticleInternal: internalProcedure
    .input(
      z.object({
        title: z.string().min(1),
        cover: z.string().min(1),
        description: z.string().min(1),
        link: z.string().min(1),
        domain: z.string().min(1),
        start_date: z.date(),
        end_date: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // This procedure can only be called from server-side code
      return createArticle(ctx.db, input as ArticleCreateInput);
    }),

  // Public procedure - validate and create an article from a URL
  validateAndCreateArticle: publicProcedure
    .input(
      z.object({
        link: z.string().url().regex(URL_PATTERN, "Invalid URL format"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await processArticleFromUrl(ctx.db, input.link);
        return result;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Error creating article:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create article",
        });
      }
    }),
});
