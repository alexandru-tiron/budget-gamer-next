import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getAvailableArticles } from "~/server/api/services/article-service";
import {
  getAvailableFreeGames,
  upsertFreeGame,
  type FreeGameCreateInput,
} from "~/server/api/services/freeGames-service";
import {
  getAvailableSubscriptionGames,
  replaceSubscriptionGames,
  upsertSubscriptionGame,
  type SubscriptionGameCreateInput,
} from "~/server/api/services/subscriptionGames-service";
import { upsertListing } from "~/server/api/utils/feeds";
import { articles, freeGames, subscriptionGames } from "./schema";
import { clearDatabase, openTestDatabase, type TestDatabase } from "./testing";

// Runs against a real Postgres server through the `postgres` driver. Set TEST_DATABASE_URL to a
// local database (see README) to enable it; CI runs it against a Postgres service container.
const testDatabaseUrl = process.env.TEST_DATABASE_URL;

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY);

function freeGame(
  overrides: Partial<FreeGameCreateInput>,
): FreeGameCreateInput {
  return {
    name: "Test Game",
    cover: "/images/articles/default.jpg",
    cover_portrait: "/images/articles/default.jpg",
    description: "A game for tests",
    developer: "Test Studio",
    publisher: "Test Publisher",
    start_date: daysFromNow(-1),
    end_date: daysFromNow(3),
    free: true,
    platform_ids: ["windows"],
    provider_id: "steam",
    provider_url: "https://store.steampowered.com/app/1/",
    release_date: null,
    ...overrides,
  };
}

function subscriptionGame(
  overrides: Partial<SubscriptionGameCreateInput>,
): SubscriptionGameCreateInput {
  return {
    name: "Test Subscription Game",
    cover: "/images/articles/default.jpg",
    cover_portrait: "/images/articles/default.jpg",
    description: "A subscription game for tests",
    developer: "Test Studio",
    publisher: "Test Publisher",
    start_date: daysFromNow(-1),
    end_date: daysFromNow(20),
    platform_ids: ["windows"],
    provider_id: "humble_bundle",
    provider_url: "https://www.humblebundle.com/store/search?search=test",
    release_date: null,
    ...overrides,
  };
}

describe.skipIf(!testDatabaseUrl)("database (postgres driver)", () => {
  let db: TestDatabase;
  let close: () => Promise<void>;

  beforeAll(async () => {
    if (!testDatabaseUrl) throw new Error("TEST_DATABASE_URL is not set");
    ({ db, close } = await openTestDatabase(testDatabaseUrl));
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    await clearDatabase(db);
  });

  it("adds a free game, then updates it when the same store URL comes back", async () => {
    expect(await upsertFreeGame(db, freeGame({ name: "First run" }))).toBe(
      "added",
    );
    expect(await upsertFreeGame(db, freeGame({ name: "Second run" }))).toBe(
      "updated",
    );

    const rows = await db.select().from(freeGames);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("Second run");
  });

  it("refuses a second row with the same store URL", async () => {
    await db.insert(freeGames).values(freeGame({}));
    await expect(db.insert(freeGames).values(freeGame({}))).rejects.toThrow();
  });

  it("lists only running offers, soonest-ending first", async () => {
    await db.insert(freeGames).values([
      freeGame({
        name: "Ends later",
        end_date: daysFromNow(5),
        provider_url: "https://store.steampowered.com/app/2/",
      }),
      freeGame({
        name: "Ends sooner",
        end_date: daysFromNow(1),
        provider_url: "https://store.steampowered.com/app/3/",
      }),
      freeGame({
        name: "Expired",
        end_date: daysFromNow(-1),
        provider_url: "https://store.steampowered.com/app/4/",
      }),
      freeGame({
        name: "Not started",
        start_date: daysFromNow(1),
        provider_url: "https://store.steampowered.com/app/5/",
      }),
    ]);

    const games = await getAvailableFreeGames(db);
    expect(games.map((game) => game.name)).toEqual([
      "Ends sooner",
      "Ends later",
    ]);
  });

  it("lists only active articles", async () => {
    const article = {
      title: "Giveaway",
      description: "A giveaway",
      cover: "/images/articles/reddit.jpg",
      domain: "reddit.com",
    };
    await db.insert(articles).values([
      {
        ...article,
        title: "Active",
        link: "https://www.reddit.com/r/test/1",
        start_date: daysFromNow(-1),
        end_date: daysFromNow(6),
      },
      {
        ...article,
        title: "Expired",
        link: "https://www.reddit.com/r/test/2",
        start_date: daysFromNow(-10),
        end_date: daysFromNow(-3),
      },
    ]);

    const active = await getAvailableArticles(db);
    expect(active.map((row) => row.title)).toEqual(["Active"]);
  });

  it("replaces one provider's subscription games and keeps the others", async () => {
    await db.insert(subscriptionGames).values([
      subscriptionGame({
        name: "Last month",
        provider_url: "https://www.humblebundle.com/store/search?search=old",
      }),
      subscriptionGame({
        name: "PS Plus game",
        provider_id: "playstation",
        provider_url: "https://store.playstation.com/en-gb/product/TEST",
      }),
    ]);

    await replaceSubscriptionGames(db, "humble_bundle", [
      subscriptionGame({
        name: "This month A",
        provider_url: "https://www.humblebundle.com/store/search?search=a",
      }),
      subscriptionGame({
        name: "This month B",
        provider_url: "https://www.humblebundle.com/store/search?search=b",
      }),
    ]);

    const names = (await getAvailableSubscriptionGames(db))
      .map((game) => game.name)
      .sort();
    expect(names).toEqual(["PS Plus game", "This month A", "This month B"]);
  });

  it("keeps the old games when the replacement fails", async () => {
    await db
      .insert(subscriptionGames)
      .values(subscriptionGame({ name: "Last month" }));

    // Two rows with the same store URL break the unique index halfway through
    const duplicate = subscriptionGame({
      name: "Duplicate",
      provider_url: "https://www.humblebundle.com/store/search?search=dup",
    });
    await expect(
      replaceSubscriptionGames(db, "humble_bundle", [duplicate, duplicate]),
    ).rejects.toThrow();

    const rows = await db.select().from(subscriptionGames);
    expect(rows.map((row) => row.name)).toEqual(["Last month"]);
  });

  it("lets two services list the same store URL", async () => {
    const url =
      "https://www.xbox.com/en-IE/games/store/the-alters/9N0P25WJHM8C";
    await upsertSubscriptionGame(
      db,
      subscriptionGame({ provider_id: "xbox_game_pass", provider_url: url }),
    );
    await upsertSubscriptionGame(
      db,
      subscriptionGame({
        provider_id: "xbox_free_play_days",
        provider_url: url,
      }),
    );
    await upsertSubscriptionGame(
      db,
      subscriptionGame({
        name: "Renamed",
        provider_id: "xbox_game_pass",
        provider_url: url,
      }),
    );

    const rows = await db.select().from(subscriptionGames);
    expect(rows.map((row) => [row.provider_id, row.name]).sort()).toEqual([
      ["xbox_free_play_days", "Test Subscription Game"],
      ["xbox_game_pass", "Renamed"],
    ]);
  });

  it("keeps the date a listing first appeared when it's refreshed", async () => {
    const { start_date: _start, ...listing } = subscriptionGame({
      provider_id: "nintendo_switch_online",
    });
    const firstSeen = daysFromNow(-3);

    expect(await upsertListing(db, listing, firstSeen)).toBe("added");
    expect(
      await upsertListing(
        db,
        { ...listing, end_date: daysFromNow(5) },
        new Date(),
      ),
    ).toBe("updated");

    const [row] = await db.select().from(subscriptionGames);
    expect(row?.start_date.getTime()).toBe(firstSeen.getTime());
    expect(row?.end_date.getTime()).toBeGreaterThan(daysFromNow(4).getTime());
  });
});
