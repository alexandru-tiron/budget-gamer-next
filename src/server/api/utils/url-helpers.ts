import { lookup } from "node:dns/promises";
import { env } from "~/env";
import { logger } from "~/server/logger";

const log = logger.child({ scope: "articles" });

// URL validation patterns
export const URL_PATTERN =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/i;

// Sites articles can link to, with the cover shown when the page has no preview image
const ARTICLE_SOURCES = {
  twitter: { domains: ["twitter.com", "x.com"], cover: "twitter.jpg" },
  humble: { domains: ["humblebundle.com"], cover: "humbleBundle.jpg" },
  gleam: { domains: ["gleam.io"], cover: "gleam.jpg" },
  reddit: { domains: ["reddit.com"], cover: "reddit.jpg" },
  facebook: { domains: ["facebook.com"], cover: "facebook.jpg" },
} as const;

type ArticleSource = keyof typeof ARTICLE_SOURCES;

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
  data?: {
    children?: RedditPost[];
  };
}

/**
 * Find which supported site a URL belongs to, by its hostname (so "evil.com/?reddit.com/" is
 * rejected), or null if it isn't an http(s) link to a supported site.
 */
export function getArticleSource(url: string): ArticleSource | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();
  for (const [source, { domains }] of Object.entries(ARTICLE_SOURCES)) {
    if (
      domains.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
      )
    ) {
      return source as ArticleSource;
    }
  }
  return null;
}

/**
 * Check if URL is from an allowed domain
 */
export function isAllowedDomain(url: string): boolean {
  return getArticleSource(url) !== null;
}

/**
 * Get the appropriate user-agent for a specific domain
 * Some sites require specific user agents to return proper metadata
 */
export function getUserAgent(url: string): Record<string, string> {
  const source = getArticleSource(url);
  if (source === "twitter") {
    return { "user-agent": "googlebot" };
  } else if (source === "reddit") {
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
  const source = getArticleSource(url);
  const cover = source ? ARTICLE_SOURCES[source].cover : "default.jpg";
  return `/images/articles/${cover}`;
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
  return urlObj.hostname.replace(/^www\./, "");
}

/**
 * Fetch metadata from a URL using link-preview-js
 */
export async function fetchLinkPreview(url: string): Promise<ArticleLinkData> {
  const userAgent = getUserAgent(url);

  try {
    // Loaded on demand so pages that only read articles don't pull in its HTTP client
    const { getLinkPreview } = await import("link-preview-js");
    const rawLinkData = await getLinkPreview(url, {
      imagesPropertyType: "og", // Use Open Graph images when available
      headers: userAgent,
      timeout: 10_000,
      // Resolving the host lets link-preview-js refuse loopback and private addresses
      resolveDNSHost: async (link) =>
        (await lookup(new URL(link).hostname)).address,
    });

    return processLinkData(rawLinkData as Record<string, unknown>);
  } catch (error) {
    log.error("Error fetching link preview", { error });
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
