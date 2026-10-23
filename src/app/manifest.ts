import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Budget Gamer",
    short_name: "Budget Gamer",
    description: "Find free games and deals across multiple platforms",
    start_url: "/",
    display: "standalone",
    background_color: "#141314",
    theme_color: "#141314",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
