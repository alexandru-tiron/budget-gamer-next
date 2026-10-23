// Budget Gamer service worker: keeps visited pages and static assets available offline.
// Bump VERSION to drop everything cached by an older worker.
const VERSION = "v1";
const PAGE_CACHE = `pages-${VERSION}`;
const ASSET_CACHE = `assets-${VERSION}`;
const MAX_ASSETS = 300;
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/favicon.ico",
  "/images/draws/maintenance_drawable.imageset/maintenance_drawable_dark.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(ASSET_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== PAGE_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API calls, cron routes and React Server Component payloads always go to the network
  if (
    url.pathname.startsWith("/api/") ||
    request.headers.has("RSC") ||
    url.searchParams.has("_rsc")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/images/") ||
    /\.(?:png|ico|svg|webmanifest)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request));
  }
});

/**
 * Pages: always try the network so prices and dates are fresh, and fall back to the last copy we
 * saw (or the offline page) when there is no connection.
 */
async function networkFirst(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (
      (await cache.match(request)) ??
      (await caches.match(OFFLINE_URL)) ??
      Response.error()
    );
  }
}

/**
 * Static assets have hashed names or rarely change, so serve them from the cache when we can.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(ASSET_CACHE);
    await cache.put(request, response.clone());
    await trimCache(cache, MAX_ASSETS);
  }
  return response;
}

/**
 * Keep the asset cache bounded by evicting the oldest entries.
 */
async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  const excess = keys.length - maxEntries;
  if (excess <= 0) return;
  await Promise.all(
    keys
      .filter((key) => !PRECACHE_URLS.includes(new URL(key.url).pathname))
      .slice(0, excess)
      .map((key) => cache.delete(key)),
  );
}
