import { describe, expect, it } from "vitest";

import {
  parseMonthlyGameTitles,
  pickMonthlyGame,
  type StoreSearchResult,
} from "./ps-plus-helpers";

describe("parseMonthlyGameTitles", () => {
  it("reads only the monthly games section", () => {
    const html = `
      <h3 class="txt-style-medium-title txt-block-paragraph__title"> 3RPJ-TAR4-C72P </h3>
      <div class="cmp-experiencefragment--wn-latest-monthly-games">
        <div class="cmp-experiencefragment--wn-latest-monthly-games-content">
          <h3 class="txt-style-medium-title txt-block-paragraph__title"> F1® 25 </h3>
          <h3 class="txt-style-medium-title txt-block-paragraph__title"> Hunt&#58; Showdown 1896 </h3>
          <h3 class="txt-style-medium-title txt-block-paragraph__title"> More games available to try right now </h3>
        </div>
      </div>
      <div class="cmp-experiencefragment--wn-game-trials-content">
        <h3 class="txt-style-medium-title txt-block-paragraph__title"> A Game Trial </h3>
      </div>`;
    expect(parseMonthlyGameTitles(html)).toEqual([
      "F1® 25",
      "Hunt: Showdown 1896",
    ]);
  });

  it("returns nothing when the section is missing", () => {
    expect(parseMonthlyGameTitles("<html></html>")).toEqual([]);
  });
});

describe("pickMonthlyGame", () => {
  const product = (
    id: string,
    classification: string,
    upsellText: string | null,
  ): StoreSearchResult => ({
    __typename: "Product",
    id,
    storeDisplayClassification: classification,
    price: {
      upsellText,
      upsellServiceBranding: upsellText ? ["PS_PLUS"] : ["NONE"],
    },
  });

  it("picks the full game included with Essential", () => {
    expect(
      pickMonthlyGame([
        product("EP-PACK", "OTHER", null),
        product("EP-OLD", "FULL_GAME", "Extra"),
        product("EP-DLC", "LEVEL", "Essential"),
        product("EP-GAME", "FULL_GAME", "Essential"),
      ]),
    ).toBe("EP-GAME");
  });

  it("falls back to any Essential product", () => {
    expect(
      pickMonthlyGame([
        product("EP-OLD", "FULL_GAME", "Extra"),
        product("EP-BUNDLE", "GAME_BUNDLE", "Essential"),
      ]),
    ).toBe("EP-BUNDLE");
  });

  it("returns null without an Essential result", () => {
    expect(pickMonthlyGame([product("EP-GAME", "FULL_GAME", null)])).toBe(null);
  });
});
