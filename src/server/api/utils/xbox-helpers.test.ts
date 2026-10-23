import { describe, expect, it } from "vitest";

import {
  extractXboxProductId,
  findFreeToKeepOffer,
  parseXboxProduct,
  type CatalogProduct,
} from "./xbox-helpers";

// Shaped like Microsoft's display catalog response, trimmed to the fields we read
function product(
  availabilities: NonNullable<
    CatalogProduct["DisplaySkuAvailabilities"]
  >[number]["Availabilities"],
  isTrial = false,
): CatalogProduct {
  return {
    ProductId: "9PKZRN4RJRC9",
    LocalizedProperties: [
      {
        ProductTitle: "Chained Beasts",
        ShortDescription: "Fight chaotic battles chained to your friends.",
        DeveloperName: "Featherweight Games",
        PublisherName: "Featherweight Games",
        Images: [
          { ImagePurpose: "Logo", Uri: "//store-images.s-microsoft.com/logo" },
          {
            ImagePurpose: "Poster",
            Uri: "//store-images.s-microsoft.com/poster",
          },
          {
            ImagePurpose: "SuperHeroArt",
            Uri: "//store-images.s-microsoft.com/hero",
          },
        ],
      },
    ],
    MarketProperties: [{ OriginalReleaseDate: "2026-10-15T17:00:00.0000000Z" }],
    Properties: { XboxConsoleGenCompatible: ["ConsoleGen9"] },
    DisplaySkuAvailabilities: [
      {
        Sku: {
          Properties: {
            IsTrial: isTrial,
            Packages: [
              {
                PlatformDependencies: [
                  { PlatformName: "Windows.Desktop" },
                  { PlatformName: "Windows.Xbox" },
                ],
              },
            ],
          },
        },
        Availabilities: availabilities,
      },
    ],
  };
}

const price = (listPrice: number, msrp: number) => ({
  ListPrice: listPrice,
  MSRP: msrp,
  CurrencyCode: "EUR",
});

describe("extractXboxProductId", () => {
  it.each([
    [
      "https://www.xbox.com/en-IE/games/store/the-alters/9n0p25wjhm8c",
      "9N0P25WJHM8C",
    ],
    [
      "https://www.xbox.com/en-US/games/store/nba-2k27/9N3D82TFF6C4/",
      "9N3D82TFF6C4",
    ],
    ["https://xbox.com/de-DE/games/store/x/BWVBNCMF22ZK", "BWVBNCMF22ZK"],
  ])("reads %s", (url, id) => {
    expect(extractXboxProductId(url)).toBe(id);
  });

  it.each([
    "https://www.xbox.com/en-IE/games/all-games",
    "https://evil.com/en-IE/games/store/x/9N0P25WJHM8C",
    "https://www.xbox.com/en-IE/games/store/x/123",
    "not a url",
  ])("rejects %s", (url) => {
    expect(extractXboxProductId(url)).toBeNull();
  });
});

describe("parseXboxProduct", () => {
  it("maps the catalog fields", () => {
    const game = parseXboxProduct(product([]));

    expect(game).toMatchObject({
      productId: "9PKZRN4RJRC9",
      name: "Chained Beasts",
      developer: "Featherweight Games",
      cover: "https://store-images.s-microsoft.com/hero",
      coverPortrait: "https://store-images.s-microsoft.com/poster",
      platformIds: ["xbox_series", "windows"],
      storeUrl:
        "https://www.xbox.com/en-IE/games/store/chained-beasts/9PKZRN4RJRC9",
    });
    expect(game.releaseDate?.toISOString()).toBe("2026-10-15T17:00:00.000Z");
  });

  it("drops invisible direction marks and placeholder release dates", () => {
    const raw = product([]);
    raw.LocalizedProperties = [
      {
        ProductTitle: "Minecraft Dungeons II",
        DeveloperName: "Mojang Studios / ‪Double Eleven Limited",
      },
    ];
    raw.MarketProperties = [
      { OriginalReleaseDate: "9998-12-30T00:00:00.0000000Z" },
    ];

    const game = parseXboxProduct(raw);
    expect(game.developer).toBe("Mojang Studios / Double Eleven Limited");
    expect(game.releaseDate).toBeNull();
  });
});

describe("findFreeToKeepOffer", () => {
  it("finds a 100% discount on the full game", () => {
    const offer = findFreeToKeepOffer(
      product([
        {
          Actions: ["Details", "Fulfill", "Purchase", "Browse"],
          Conditions: { EndDate: "2026-06-30T23:59:59.0000000Z" },
          OrderManagementData: { Price: price(0, 19.99) },
        },
      ]),
    );
    expect(offer?.endDate?.toISOString()).toBe("2026-06-30T23:59:59.000Z");
  });

  it("ignores Game Pass entitlements, which have no normal price", () => {
    expect(
      findFreeToKeepOffer(
        product([
          {
            Actions: ["Purchase", "Browse"],
            OrderManagementData: { Price: price(19.99, 19.99) },
          },
          {
            Actions: ["Details", "Purchase", "Curate"],
            OrderManagementData: { Price: price(0, 0) },
          },
        ]),
      ),
    ).toBeNull();
  });

  it("ignores free trials", () => {
    expect(
      findFreeToKeepOffer(
        product(
          [
            {
              Actions: ["Purchase"],
              OrderManagementData: { Price: price(0, 19.99) },
            },
          ],
          true,
        ),
      ),
    ).toBeNull();
  });

  it("ignores offers you can't buy", () => {
    expect(
      findFreeToKeepOffer(
        product([
          {
            Actions: ["Details"],
            OrderManagementData: { Price: price(0, 19.99) },
          },
        ]),
      ),
    ).toBeNull();
  });
});
