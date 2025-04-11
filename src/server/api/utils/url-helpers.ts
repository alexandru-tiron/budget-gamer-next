import { getLinkPreview } from "link-preview-js";
import { env } from "~/env";

// URL validation patterns
export const URL_PATTERN =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/i;
export const TWITTER_PATTERN = /twitter\.com\/.*/i;
export const HUMBLE_PATTERN = /humblebundle\.com\/.*/i;
export const GLEAM_PATTERN = /gleam\.io\/.*/i;
export const REDDIT_PATTERN = /reddit\.com\/.*/i;
export const FACEBOOK_PATTERN = /facebook\.com\/.*/i;

// Interface for standardized link data
export interface ArticleLinkData {
  title?: string;
  description?: string;
  images?: string[];
  url: string;
}

// Reddit API response types
interface RedditPostData {
  url: string;
  link_flair_text?: string;
}

interface RedditPost {
  data: RedditPostData;
}

interface RedditApiResponse {
  data: {
    children: RedditPost[];
  };
}

/**
 * Check if a URL matches a given pattern
 */
export function doesUrlMatch(url: string, pattern: RegExp): boolean {
  return pattern.test(url);
}

/**
 * Check if URL is from an allowed domain
 */
export function isAllowedDomain(url: string): boolean {
  return (
    doesUrlMatch(url, TWITTER_PATTERN) ||
    doesUrlMatch(url, HUMBLE_PATTERN) ||
    doesUrlMatch(url, GLEAM_PATTERN) ||
    doesUrlMatch(url, REDDIT_PATTERN) ||
    doesUrlMatch(url, FACEBOOK_PATTERN)
  );
}

/**
 * Get the appropriate user-agent for a specific domain
 * Some sites require specific user agents to return proper metadata
 */
export function getUserAgent(url: string): Record<string, string> {
  if (doesUrlMatch(url, TWITTER_PATTERN)) {
    return { "user-agent": "googlebot" };
  } else if (doesUrlMatch(url, REDDIT_PATTERN)) {
    return { "user-agent": "WhatsApp/2.22.18.75 A" };
  } else {
    return {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    };
  }
}

/**
 * Get a default cover image based on domain
 */
export function getDefaultCoverImage(url: string): string {
  if (doesUrlMatch(url, TWITTER_PATTERN)) {
    return "https://firebasestorage.googleapis.com/v0/b/budget-gamer-debug.appspot.com/o/defaultImages%2Ftwitter.jpg?alt=media&token=92f9aade-f7a2-4bc9-b645-d5a8f8a9bb63";
  } else if (doesUrlMatch(url, HUMBLE_PATTERN)) {
    return "https://firebasestorage.googleapis.com/v0/b/budget-gamer-debug.appspot.com/o/defaultImages%2FhumbleBundle.jpg?alt=media&token=be57d6e8-c715-45cd-a1f4-5855635afef5";
  } else if (doesUrlMatch(url, GLEAM_PATTERN)) {
    return "https://firebasestorage.googleapis.com/v0/b/budget-gamer-debug.appspot.com/o/defaultImages%2Fgleam.jpg?alt=media&token=7916b299-78bf-479d-b1d3-568e459a28ef";
  } else if (doesUrlMatch(url, REDDIT_PATTERN)) {
    return "https://firebasestorage.googleapis.com/v0/b/budget-gamer-debug.appspot.com/o/defaultImages%2Freddit.jpg?alt=media&token=df915d1e-e68c-4d45-95a3-d1c1c8755fb6";
  } else if (doesUrlMatch(url, FACEBOOK_PATTERN)) {
    return "https://firebasestorage.googleapis.com/v0/b/budget-gamer-debug.appspot.com/o/defaultImages%2Ffacebook.jpg?alt=media&token=abcf3d70-22cc-457f-bc25-5f82e67c5ad3";
  } else {
    return "https://firebasestorage.googleapis.com/v0/b/budget-gamer-debug.appspot.com/o/defaultImages%2Fdefault.jpg?alt=media&token=37aef14b-5e4a-49ea-bd5c-e074feb9013b";
  }
}

/**
 * Process the result from getLinkPreview to ensure consistent data structure
 */
export function processLinkData(
  data: Record<string, unknown>,
): ArticleLinkData {
  // Handle different types of responses from getLinkPreview
  const result: ArticleLinkData = {
    url: typeof data.url === "string" ? data.url : "",
    title: undefined,
    description: undefined,
    images: undefined,
  };

  // The link preview might return different structures based on the content type
  if ("title" in data && typeof data.title === "string") {
    result.title = data.title;
  }

  if ("description" in data && typeof data.description === "string") {
    result.description = data.description;
  }

  if ("images" in data && Array.isArray(data.images)) {
    result.images = data.images as string[];
  } else if (
    "favicons" in data &&
    Array.isArray(data.favicons) &&
    data.favicons.length > 0
  ) {
    result.images = data.favicons as string[];
  }

  return result;
}

/**
 * Extract domain from a URL
 */
export function extractDomain(url: string): string {
  const urlObj = new URL(url);
  return urlObj.hostname.replace("www.", "");
}

/**
 * Fetch metadata from a URL using link-preview-js
 */
export async function fetchLinkPreview(url: string): Promise<ArticleLinkData> {
  const userAgent = getUserAgent(url);

  try {
    const rawLinkData = await getLinkPreview(url, {
      imagesPropertyType: "og", // Use Open Graph images when available
      headers: userAgent,
    });

    return processLinkData(rawLinkData as Record<string, unknown>);
  } catch (error) {
    console.error("Error fetching link preview:", error);
    // Return basic data if preview fails
    return {
      url,
      title: undefined,
      description: undefined,
      images: undefined,
    };
  }
}

/**
 * Fetches articles from multiple Reddit subreddits
 * @returns Array of article URLs from Reddit
 */
export async function fetchRedditArticles(): Promise<string[]> {
  const articleUrls: string[] = [];

  // Get Reddit API token
  const tokenResponse = await fetch(
    "https://www.reddit.com/api/v1/access_token?grant_type=https://oauth.reddit.com/grants/installed_client&device_id=00000000000000000000",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${env.REDDIT_AUTH_TOKEN}=`,
      },
    },
  );

  const tokenData = (await tokenResponse.json()) as { access_token: string };
  const token = tokenData.access_token;

  if (!token) {
    throw new Error("Failed to get Reddit API token");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Search sources
  const sources = [
    "https://oauth.reddit.com/r/GiftofGames/search/?q=[OFFER]&type=link&t=day&sort=new&limit=10&restrict_sr=on",
    "https://oauth.reddit.com/r/FreeGameFindings/search/?q=giveaway&type=link&t=day&sort=new&limit=5&restrict_sr=on",
    "https://oauth.reddit.com/r/steam_giveaway/search/?q=giveaway&type=link&t=day&sort=new&limit=5&restrict_sr=on",
  ];

  for (const url of sources) {
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    const data = (await response.json()) as RedditApiResponse;
    const articles = data.data?.children ?? [];

    for (const article of articles) {
      const isOpen = url.includes("steam_giveaway")
        ? article.data.link_flair_text === "OPEN"
        : true;

      if (isOpen && article.data.url) {
        articleUrls.push(article.data.url);
      }
    }
  }

  return articleUrls;
}
