import { describe, expect, it } from "vitest";

import { extractPsGameIds, parsePsProductPage } from "./playstation-helpers";

const ID = "EP4291-PPSA16357_00-0286411811680806";

// Trimmed-down copy of the JSON blobs a store product page embeds
const productPage = (price: number) => `
  <script id="mfe-jsonld-tags" type="application/ld+json">
    {"@type":"Product","name":"Hunt: Showdown 1896","offers":{"price":${price}}}
  </script>
  <script id="env:media" type="application/json">
    {"cache":{"Product:${ID}":{"name":"Hunt: Showdown 1896","media":[
      {"role":"MASTER","url":"https://image.api.playstation.com/master.png"},
      {"role":"GAMEHUB_COVER_ART","url":"https://image.api.playstation.com/cover.jpg"}
    ]}}}
  </script>
  <script id="env:details" type="application/json">
    {"cache":{"Product:${ID}":{"publisherName":"Crytek Gmbh ","releaseDate":"2024-08-15T07:00:00Z",
      "platforms":["PS5"],"descriptions":[{"type":"SHORT","value":"Short"},
      {"type":"LONG","value":"A new era<br>of extraction."}]}}}
  </script>
  <script>window.notJson = true;</script>`;

describe("parsePsProductPage", () => {
  it("merges the product from every JSON blob", () => {
    expect(parsePsProductPage(productPage(24.99), ID)).toEqual({
      name: "Hunt: Showdown 1896",
      cover: "https://image.api.playstation.com/cover.jpg",
      cover_portrait: "https://image.api.playstation.com/master.png",
      description: "A new era\nof extraction.",
      developer: "Crytek Gmbh",
      publisher: "Crytek Gmbh",
      platform_ids: ["ps5"],
      free: false,
      release_date: new Date("2024-08-15T07:00:00Z"),
    });
  });

  it("reads a zero price as free", () => {
    expect(parsePsProductPage(productPage(0), ID)?.free).toBe(true);
  });

  it("returns null for another product", () => {
    expect(parsePsProductPage(productPage(0), "EP0000-OTHER")).toBeNull();
  });
});

describe("extractPsGameIds", () => {
  it("reads product ids from store links", () => {
    expect(
      extractPsGameIds(
        `https://store.playstation.com/en-gb/product/${ID}?smcid=web`,
      ),
    ).toEqual([ID]);
  });
});
