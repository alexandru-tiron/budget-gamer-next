import { describe, expect, it } from "vitest";

import { parseGameLink } from "./game-link-service";

describe("parseGameLink", () => {
  it.each([
    [
      "https://store.steampowered.com/app/1234/Some_Game/?snr=1_2",
      "steam",
      "https://store.steampowered.com/app/1234/",
    ],
    [
      "https://store.steampowered.com/app/1234",
      "steam",
      "https://store.steampowered.com/app/1234/",
    ],
    [
      "https://store.playstation.com/en-gb/product/EP0001-CUSA00001_00-GAME0000000000001/",
      "playstation",
      "https://store.playstation.com/en-gb/product/EP0001-CUSA00001_00-GAME0000000000001",
    ],
    [
      "https://humblebundle.com/store/some-game?hmb_source=x",
      "humble_bundle",
      "https://www.humblebundle.com/store/some-game",
    ],
    [
      "https://www.gog.com/en/game/some_game",
      "gog",
      "https://www.gog.com/en/game/some_game",
    ],
    [
      "https://www.gog.com/game/some_game#reviews",
      "gog",
      "https://www.gog.com/game/some_game",
    ],
    [
      "https://store.epicgames.com/en-US/p/some-game",
      "epic_games",
      "https://store.epicgames.com/en-US/p/some-game",
    ],
    [
      "https://www.xbox.com/en-US/games/store/The-Alters/9n0p25wjhm8c?ocid=x",
      "xbox",
      "https://www.xbox.com/en-IE/games/store/the-alters/9N0P25WJHM8C",
    ],
    [
      "https://www.nintendo.com/en-gb/Games/Nintendo-Switch-games/Animal-Crossing-New-Horizons-1438623.html",
      "nintendo_eshop",
      "https://www.nintendo.com/en-gb/Games/Nintendo-Switch-games/Animal-Crossing-New-Horizons-1438623.html",
    ],
  ])("parses %s", (link, provider, url) => {
    expect(parseGameLink(link)).toEqual({ provider, url });
  });

  it.each([
    "https://evil.com/store.steampowered.com/app/1",
    "https://store.steampowered.com.evil.com/app/1",
    "https://store.steampowered.com/bundle/1",
    "https://www.humblebundle.com/games/some-bundle",
    "https://store.playstation.com/en-gb/concept/123",
    "https://www.xbox.com/en-IE/games/all-games",
    "https://www.nintendo.com/us/store/products/animal-crossing-new-horizons-switch/",
    "javascript:alert(1)",
    "not a url",
  ])("rejects %s", (link) => {
    expect(parseGameLink(link)).toBeNull();
  });
});
