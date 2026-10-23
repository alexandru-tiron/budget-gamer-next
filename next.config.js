/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

// Image CDNs used by the stores we scrape. Article previews can come from any site, so those
// images skip the optimizer instead of opening it up to every host.
const imageHosts = [
  "**.steamstatic.com",
  "**.akamaihd.net",
  "**.epicgames.com",
  "**.unrealengine.com",
  "**.gog-statics.com",
  "**.gog.com",
  "**.imgix.net",
  "**.humblebundle.com",
  "**.playstation.com",
  "**.playstation.net",
  "**.media-amazon.com",
  "**.ssl-images-amazon.com",
  "**.s-microsoft.com",
  "**.nintendo.com",
];

/** @type {import("next").NextConfig} */
const config = {
  // Docker and self-hosted builds bundle a minimal Node server; Vercel doesn't need it
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  images: {
    remotePatterns: imageHosts.map((hostname) => ({
      protocol: "https",
      hostname,
    })),
  },
  async headers() {
    return [
      {
        // Browsers must always fetch the latest service worker
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ];
  },
};

export default config;
