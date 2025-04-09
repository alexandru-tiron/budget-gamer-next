import { postRouter } from "./post";
import { articlesRouter } from "./articles";
import { freeGamesRouter } from "./freeGames";
import { scheduledRouter } from "./scheduled";
import { parsersRouter } from "./parsers";
import type { AnyRouter } from "@trpc/server";

export const apiRouters: Record<string, AnyRouter> = {
  post: postRouter,
  articles: articlesRouter,
  freeGames: freeGamesRouter,
  scheduled: scheduledRouter,
  parsers: parsersRouter,
};
