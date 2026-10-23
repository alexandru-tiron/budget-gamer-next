import type {
  articles,
  freeGames,
  subscriptionGames,
} from "~/server/db/schema";

export type FreeGame = typeof freeGames.$inferSelect;

export type SubscriptionGame = typeof subscriptionGames.$inferSelect;

export type Article = typeof articles.$inferSelect;
