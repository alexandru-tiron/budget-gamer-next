import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import * as schema from "~/server/db/schema";
import {
  fetchLinkPreview,
  extractDomain,
  getDefaultCoverImage,
  isAllowedDomain,
} from "../utils/url-helpers";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

export interface ArticleCreateInput {
  title: string;
  cover: string;
  description: string;
  link: string;
  domain: string;
  start_date: Date;
  end_date: Date;
}

export interface ArticleOutput {
  id: number;
  createdAt: Date;
  updatedAt: Date | null;
  title: string;
  cover: string;
  description: string;
  link: string;
  domain: string;
  start_date: Date | null;
  end_date: Date | null;
}

/**
 * Check if an article with this link already exists
 */
export async function checkArticleExists(
  db: NeonHttpDatabase<typeof schema>,
  link: string,
): Promise<boolean> {
  const existingArticle = await db.query.articles.findFirst({
    where: eq(schema.articles.link, link),
  });

  return !!existingArticle;
}

/**
 * Insert an article into the database
 */
export async function createArticle(
  db: NeonHttpDatabase<typeof schema>,
  data: ArticleCreateInput,
): Promise<{ success: true }> {
  await db.insert(schema.articles).values({
    title: data.title,
    cover: data.cover,
    description: data.description,
    link: data.link,
    domain: data.domain,
    start_date: data.start_date,
    end_date: data.end_date,
  });

  return { success: true };
}

/**
 * Get available articles (current date is between start_date and end_date)
 */
export async function getAvailableArticles(
  db: NeonHttpDatabase<typeof schema>,
): Promise<ArticleOutput[] | null> {
  const articlesData = await db.query.articles.findMany({
    where: (articles, { lte, gte, and }) =>
      and(
        gte(articles.start_date, new Date()),
        lte(articles.end_date, new Date()),
      ),
    orderBy: (articles, { asc }) => [asc(articles.end_date)],
  });

  return articlesData ?? null;
}

/**
 * Process a URL to create an article
 */
export async function processArticleFromUrl(
  db: NeonHttpDatabase<typeof schema>,
  link: string,
): Promise<{ success: boolean; article?: ArticleCreateInput }> {
  // Check if URL is from allowed domains
  if (!isAllowedDomain(link)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "URL domain not allowed",
    });
  }

  // Check if article already exists
  const exists = await checkArticleExists(db, link);
  if (exists) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Article already exists",
    });
  }

  // Fetch and process the link data
  const linkData = await fetchLinkPreview(link);
  const domain = extractDomain(link);

  // Process metadata
  const title = linkData.title ?? `Article from ${domain}`;
  const description = linkData.description ?? `An article from ${domain}`;

  // Get cover image
  let cover = getDefaultCoverImage(link);

  if (linkData.images && linkData.images.length > 0) {
    const firstImage = linkData.images[0];

    // Only use the image if it's not the Reddit default icon
    if (
      firstImage &&
      firstImage !== "https://www.redditstatic.com/new-icon.png"
    ) {
      cover = firstImage;
    }
  }

  // Set start and end date (current time + 7 days)
  const start_date = new Date();
  const end_date = new Date();
  end_date.setDate(end_date.getDate() + 7); // 7 days from now

  // Create the article data
  const articleData: ArticleCreateInput = {
    title,
    cover,
    description,
    link,
    domain,
    start_date,
    end_date,
  };

  // Insert the article
  await createArticle(db, articleData);

  return {
    success: true,
    article: articleData,
  };
}
