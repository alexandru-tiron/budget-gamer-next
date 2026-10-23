import { describe, expect, it } from "vitest";

import { parseLunaItems, type LunaItem } from "./amazon-prime-helpers";

const NOW = new Date("2026-10-23T12:00:00Z");

const doom: LunaItem = {
  category: "FULL_GAME",
  assets: {
    title: "DOOM",
    shortformDescription: "Rip and tear.",
    externalClaimLink:
      "https://gaming.amazon.com/doom-gog/dp/amzn1.pg.item.b095?ref_=SM_DOOM_FGWP",
    cardMedia: {
      defaultMedia: { src2x: "https://m.media-amazon.com/doom.jpg" },
    },
  },
  offers: [
    { startTime: "2026-10-01T17:00:00Z", endTime: "2026-11-04T18:00:00Z" },
  ],
  game: {
    assets: {
      publisher: "Bethesda",
      primaryDeveloper: null,
      releaseDate: "2016-05-13T00:00:00Z",
      longformDescription: "",
      heroMedia: null,
    },
  },
};

describe("parseLunaItems", () => {
  it("maps a free game", () => {
    expect(parseLunaItems([doom], NOW)).toEqual([
      {
        name: "DOOM",
        cover: "https://m.media-amazon.com/doom.jpg",
        cover_portrait: "https://m.media-amazon.com/doom.jpg",
        description: "Rip and tear.",
        developer: "Bethesda",
        publisher: "Bethesda",
        release_date: new Date("2016-05-13T00:00:00Z"),
        start_date: new Date("2026-10-01T17:00:00Z"),
        end_date: new Date("2026-11-04T18:00:00Z"),
        provider_url:
          "https://gaming.amazon.com/doom-gog/dp/amzn1.pg.item.b095",
      },
    ]);
  });

  it("prefers the game's own artwork, description and developer", () => {
    const [game] = parseLunaItems(
      [
        {
          ...doom,
          game: {
            assets: {
              publisher: "Bethesda",
              primaryDeveloper: "id Software",
              longformDescription: "The full story.",
              heroMedia: {
                defaultMedia: { src2x: "https://m.media-amazon.com/hero.jpg" },
              },
            },
          },
        },
      ],
      NOW,
    );
    expect(game).toMatchObject({
      cover: "https://m.media-amazon.com/hero.jpg",
      cover_portrait: "https://m.media-amazon.com/doom.jpg",
      description: "The full story.",
      developer: "id Software",
    });
  });

  it("skips loot, ended offers and incomplete items", () => {
    expect(
      parseLunaItems(
        [
          { ...doom, category: "IN_GAME_LOOT" },
          { ...doom, offers: [{ endTime: "2026-10-20T00:00:00Z" }] },
          { ...doom, offers: [] },
          { ...doom, assets: { ...doom.assets, externalClaimLink: null } },
          { ...doom, assets: { ...doom.assets, externalClaimLink: "/doom" } },
        ],
        NOW,
      ),
    ).toEqual([]);
  });
});
