import chromium from "@sparticuz/chromium-min";
import puppeteerCore, { type Browser, type Page } from "puppeteer-core";

import { env } from "~/env";
import { BROWSER_USER_AGENT } from "./http";
import { logger } from "~/server/logger";

const log = logger.child({ scope: "puppeteer" });

// chromium-min ships without a browser binary, so serverless runs download this pack on a cold
// start and cache it in /tmp. Keep the version in sync with @sparticuz/chromium-min.
const DEFAULT_CHROMIUM_PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v153.0.0/chromium-v153.0.0-pack.x64.tar";

const LOCAL_BROWSER_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-accelerated-2d-canvas",
  "--disable-gpu",
];

export async function getBrowser(): Promise<Browser> {
  // An installed Chromium, e.g. the one in the Docker image
  if (env.CHROMIUM_EXECUTABLE_PATH) {
    log.info("Using installed Chromium", {
      executablePath: env.CHROMIUM_EXECUTABLE_PATH,
    });
    return puppeteerCore.launch({
      executablePath: env.CHROMIUM_EXECUTABLE_PATH,
      headless: true,
      args: LOCAL_BROWSER_ARGS,
      defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
    });
  }

  // The serverless Chromium build only runs on Linux; use Puppeteer's own Chrome elsewhere
  if (process.env.NODE_ENV === "development" || process.platform !== "linux") {
    log.info("Using regular Puppeteer");
    // Dev dependency only, so it's loaded lazily and never bundled for production
    const { default: puppeteer } = await import("puppeteer");
    return puppeteer.launch({ headless: true, args: LOCAL_BROWSER_ARGS });
  }

  log.info("Using serverless Chromium");
  return puppeteerCore.launch({
    args: await puppeteerCore.defaultArgs({
      args: chromium.args,
      headless: "shell",
    }),
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
    executablePath: await chromium.executablePath(
      env.CHROMIUM_PACK_URL ?? DEFAULT_CHROMIUM_PACK_URL,
    ),
    headless: "shell",
  });
}

/**
 * Open a page with a desktop viewport and bounded timeouts, so a slow site can't hang a
 * serverless function until it is killed.
 */
export async function newPage(
  browser: Browser,
  userAgent = BROWSER_USER_AGENT,
): Promise<Page> {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(20_000);
  page.setDefaultTimeout(10_000);
  await page.setUserAgent({ userAgent });
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  return page;
}

/**
 * Delay execution for a specified time
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Map over items with at most `limit` promises in flight at once.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array<R>(items.length);
  // Workers share one iterator, so each item is handed out exactly once
  const queue = items.entries();

  const worker = async () => {
    for (const [index, item] of queue) {
      results[index] = await fn(item);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}
