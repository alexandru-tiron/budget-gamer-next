import { describe, expect, it } from "vitest";

import {
  extractNintendoGameId,
  findFreeToKeepPrice,
  parseGameTrialsPage,
  parseNintendoGame,
} from "./nintendo-helpers";

describe("extractNintendoGameId", () => {
  it.each([
    [
      "https://www.nintendo.com/en-gb/Games/Nintendo-Switch-games/Animal-Crossing-New-Horizons-1438623.html",
      "1438623",
    ],
    [
      "https://www.nintendo.com/en-gb/Games/Nintendo-Switch-download-software/Wargroove-2-2437296.html?c=trial",
      "2437296",
    ],
    [
      "https://www.nintendo.com/de-de/Spiele/Nintendo-Switch-Download-Software/Wargroove-2-2437300.html",
      "2437300",
    ],
  ])("reads %s", (url, id) => {
    expect(extractNintendoGameId(url)).toBe(id);
  });

  it.each([
    "https://www.nintendo.com/us/store/products/animal-crossing-new-horizons-switch/",
    "https://evil.com/en-gb/Games/Some-Game-1438623.html",
    "not a url",
  ])("rejects %s", (url) => {
    expect(extractNintendoGameId(url)).toBeNull();
  });
});

describe("parseNintendoGame", () => {
  it("maps Nintendo of Europe's search fields", () => {
    const game = parseNintendoGame({
      fs_id: "2437296",
      title: "Wargroove 2",
      url: "/en-gb/Games/Nintendo-Switch-download-software/Wargroove-2-2437296.html",
      nsuid_txt: ["70010000062113"],
      excerpt: "Turn-based tactics",
      publisher: "Chucklefish",
      image_url: "https://www.nintendo.com/eu/media/packshot.jpg",
      image_url_h2x1_s: "https://www.nintendo.com/eu/media/h2x1.jpg",
      dates_released_dts: ["2023-10-05T00:00:00Z"],
      system_names_txt: ["Nintendo Switch 2", "Nintendo Switch"],
    });

    expect(game).toMatchObject({
      id: "2437296",
      name: "Wargroove 2",
      nsuids: ["70010000062113"],
      url: "https://www.nintendo.com/en-gb/Games/Nintendo-Switch-download-software/Wargroove-2-2437296.html",
      developer: "Chucklefish",
      cover: "https://www.nintendo.com/eu/media/h2x1.jpg",
      coverPortrait: "https://www.nintendo.com/eu/media/packshot.jpg",
      platformIds: ["nintendo_switch_2", "nintendo_switch"],
    });
  });
});

describe("findFreeToKeepPrice", () => {
  it("finds a sale price of 0 on a paid game", () => {
    const offer = findFreeToKeepPrice([
      {
        sales_status: "onsale",
        regular_price: { raw_value: "19.99" },
        discount_price: {
          raw_value: "0.00",
          end_datetime: "2026-11-01T22:59:59Z",
        },
      },
    ]);
    expect(offer?.endDate?.toISOString()).toBe("2026-11-01T22:59:59.000Z");
  });

  it("ignores free-to-start games and ordinary sales", () => {
    expect(
      findFreeToKeepPrice([{ regular_price: { raw_value: "0.00" } }]),
    ).toBeNull();
    expect(
      findFreeToKeepPrice([
        {
          regular_price: { raw_value: "59.99" },
          discount_price: { raw_value: "39.99" },
        },
      ]),
    ).toBeNull();
    expect(findFreeToKeepPrice([])).toBeNull();
  });
});

describe("parseGameTrialsPage", () => {
  it("reads the current Game Trial", () => {
    const html = `
      <h2>Game Trials</h2>
      <p>The following Game Trial is currently available:</p></div>
      <div class="content n-lazy">
        <a href="/en-gb/Games/Nintendo-Switch-download-software/Wargroove-2-2437296.html?c=trial" class="" title="Wargroove 2">
          <img src="https://www.nintendo.com/eu/media/grey.gif" data-xs="https://www.nintendo.com/eu/media/2x1_Wargroove2_Banner.jpg" alt="banner" />
        </a>
      </div>
      <h2>Nintendo Switch Game Vouchers</h2>
      <a href="/en-gb/Games/Nintendo-Switch-games/Voucher-Game-1111111.html">Not a trial</a>`;

    expect(parseGameTrialsPage(html)).toEqual([
      {
        gameId: "2437296",
        title: "Wargroove 2",
        banner: "https://www.nintendo.com/eu/media/2x1_Wargroove2_Banner.jpg",
      },
    ]);
  });

  it("returns nothing when no trial is running", () => {
    expect(parseGameTrialsPage("<h2>Game Vouchers</h2>")).toEqual([]);
  });
});
