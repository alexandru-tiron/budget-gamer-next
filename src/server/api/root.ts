import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { db } from "~/server/db";
import { articlesRouter } from "./routers/articles";
import { parsersRouter } from "./routers/parsers";
import { freeGamesRouter } from "./routers/freeGames";
import { scheduledRouter } from "./routers/scheduled";
import { subscriptionGamesRouter } from "./routers/subscriptionGames";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  articles: articlesRouter,
  freeGames: freeGamesRouter,
  subscriptionGames: subscriptionGamesRouter,
  scheduled: scheduledRouter,
  parsers: parsersRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
export const caller = createCaller({
  __internal: true,
  headers: new Headers(),
  db: db,
});
