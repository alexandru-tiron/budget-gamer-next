import { articles, freeGames, subscriptionGames } from "~/server/db/schema";
import type { TestDatabase } from "~/server/db/testing";

// Data the end-to-end tests seed before the app is built. Covers point at local images so the
// tests never depend on store CDNs.

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY);
const COVER = "/images/articles/default.jpg";

export const steamGame = {
  name: "E2E Steam Adventure",
  developer: "Valve Test Studio",
  publisher: "Test Publisher",
  description: "A free-to-keep Steam game used by the end-to-end tests.",
  provider_id: "steam",
  provider_url: "https://store.steampowered.com/app/100001/",
};

export const epicGame = {
  name: "E2E Epic Quest",
  developer: "Epic Test Studio",
  publisher: "Epic Test Studio",
  description: "A free Epic Games Store game used by the end-to-end tests.",
  provider_id: "epic_games",
  provider_url: "https://store.epicgames.com/en-US/p/e2e-epic-quest",
};

export const expiredGame = {
  name: "E2E Expired Freebie",
  developer: "Old Studio",
  publisher: "Old Studio",
  description: "An offer that already ended.",
  provider_id: "steam",
  provider_url: "https://store.steampowered.com/app/100002/",
};

export const subscriptionFixtures = {
  amazon: { name: "E2E Prime Gaming Pick", section: "Amazon Games" },
  humble: { name: "E2E Humble Choice Pick", section: "Humble Bundle" },
  playstation: { name: "E2E PS Plus Pick", section: "PlayStation Plus" },
  gamePass: { name: "E2E Game Pass Pick", section: "Xbox Game Pass" },
  freePlayDays: {
    name: "E2E Free Play Days Pick",
    section: "Xbox Free Play Days",
  },
  nintendoTrial: {
    name: "E2E Game Trial Pick",
    section: "Nintendo Switch Online Game Trials",
  },
};

// The same Xbox game in two services at once (allowed by the per-service unique index)
const SHARED_XBOX_URL =
  "https://www.xbox.com/en-IE/games/store/e2e-game-pass-pick/9NBLGGH4R315";

export const activeArticle = {
  title: "E2E Giveaway Thread",
  link: "https://www.reddit.com/r/FreeGameFindings/comments/e2e/",
};

export const expiredArticle = {
  title: "E2E Old Giveaway",
  link: "https://www.reddit.com/r/FreeGameFindings/comments/old/",
};

export async function seedDatabase(db: TestDatabase): Promise<void> {
  const freeGameDefaults = {
    cover: COVER,
    cover_portrait: COVER,
    free: true,
    platform_ids: ["windows", "mac_os"],
    release_date: new Date("2024-05-01T00:00:00Z"),
  };

  await db.insert(freeGames).values([
    {
      ...freeGameDefaults,
      ...steamGame,
      start_date: daysFromNow(-1),
      end_date: daysFromNow(2),
    },
    {
      ...freeGameDefaults,
      ...epicGame,
      start_date: daysFromNow(-2),
      end_date: daysFromNow(5),
    },
    {
      ...freeGameDefaults,
      ...expiredGame,
      start_date: daysFromNow(-10),
      end_date: daysFromNow(-3),
    },
  ]);

  const subscriptionDefaults = {
    cover: COVER,
    cover_portrait: COVER,
    description: "A subscription game used by the end-to-end tests.",
    developer: "Test Studio",
    publisher: "Test Publisher",
    start_date: daysFromNow(-5),
    end_date: daysFromNow(20),
    release_date: null,
  };

  await db.insert(subscriptionGames).values([
    {
      ...subscriptionDefaults,
      name: subscriptionFixtures.amazon.name,
      platform_ids: ["windows"],
      provider_id: "amazon_games",
      provider_url: "https://gaming.amazon.com/e2e-prime-gaming-pick/dp/1",
    },
    {
      ...subscriptionDefaults,
      name: subscriptionFixtures.humble.name,
      platform_ids: ["windows", "linux"],
      provider_id: "humble_bundle",
      provider_url:
        "https://www.humblebundle.com/store/search?search=e2e%20humble%20choice",
    },
    {
      ...subscriptionDefaults,
      name: subscriptionFixtures.playstation.name,
      platform_ids: ["ps5"],
      provider_id: "playstation",
      provider_url: "https://store.playstation.com/en-gb/product/E2E-PS-PLUS",
    },
    {
      ...subscriptionDefaults,
      name: subscriptionFixtures.gamePass.name,
      platform_ids: ["xbox_series", "windows"],
      provider_id: "xbox_game_pass",
      provider_url: SHARED_XBOX_URL,
    },
    {
      ...subscriptionDefaults,
      name: subscriptionFixtures.freePlayDays.name,
      platform_ids: ["xbox_series"],
      provider_id: "xbox_free_play_days",
      provider_url: SHARED_XBOX_URL,
    },
    {
      ...subscriptionDefaults,
      name: subscriptionFixtures.nintendoTrial.name,
      platform_ids: ["nintendo_switch_2"],
      provider_id: "nintendo_switch_online",
      provider_url:
        "https://www.nintendo.com/en-gb/Games/Nintendo-Switch-download-software/E2E-Game-Trial-Pick-1000001.html",
    },
  ]);

  const articleDefaults = {
    description: "Free game keys for the end-to-end tests.",
    cover: "/images/articles/reddit.jpg",
    domain: "reddit.com",
  };

  await db.insert(articles).values([
    {
      ...articleDefaults,
      ...activeArticle,
      start_date: daysFromNow(-1),
      end_date: daysFromNow(6),
    },
    {
      ...articleDefaults,
      ...expiredArticle,
      start_date: daysFromNow(-12),
      end_date: daysFromNow(-5),
    },
  ]);
}
