import { db } from "./db";

export async function getSubscriptionGames() {
  return await db.query.subscriptionGames.findMany({
    where: (subscriptionGames, { lte, gte, and }) =>
      and(
        gte(subscriptionGames.end_date, new Date()),
        lte(subscriptionGames.start_date, new Date()),
      ),
  });
}

export async function getArticles() {
  return await db.query.articles.findMany({
    where: (articles, { lte, gte, and }) =>
      and(
        lte(articles.start_date, new Date()),
        gte(articles.end_date, new Date()),
      ),
    orderBy: (articles, { asc }) => [asc(articles.end_date)],
  });
}

export async function getFreeGames() {
  return await db.query.freeGames.findMany({
    where: (freeGames, { lte, gte, and }) =>
      and(
        gte(freeGames.end_date, new Date()),
        lte(freeGames.start_date, new Date()),
      ),

    orderBy: (freeGames, { asc }) => [asc(freeGames.end_date)],
  });
}
