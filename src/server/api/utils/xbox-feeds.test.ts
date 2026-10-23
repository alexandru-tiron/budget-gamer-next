import { describe, expect, it } from "vitest";

import {
  extractStoreProductIds,
  findLatestFreePlayDaysPost,
  parseFreePlayDaysPost,
  parseGamePassList,
} from "./xbox-feeds";

describe("parseGamePassList", () => {
  it("skips the header and returns the product ids", () => {
    expect(
      parseGamePassList([
        { siglId: "f13cf6b4", title: "Recently added" },
        { id: "9PKZRN4RJRC9" },
        { id: "9NQVHHW88XW9" },
      ]),
    ).toEqual(["9PKZRN4RJRC9", "9NQVHHW88XW9"]);
    expect(parseGamePassList({ error: "nope" })).toEqual([]);
  });
});

describe("findLatestFreePlayDaysPost", () => {
  it("picks the newest post", () => {
    const html = `
      <a href="https://news.xbox.com/en-us/2026/10/08/free-play-days-10-08-2026/">old</a>
      <a href="https://news.xbox.com/en-us/2026/10/15/free-play-days-10-15-2026/">new</a>
      <a href="https://news.xbox.com/en-us/2026/10/01/free-play-days-01-10-2026/">older</a>`;
    expect(findLatestFreePlayDaysPost(html)).toBe(
      "https://news.xbox.com/en-us/2026/10/15/free-play-days-10-15-2026/",
    );
    expect(findLatestFreePlayDaysPost("<p>nothing</p>")).toBeNull();
  });
});

describe("extractStoreProductIds", () => {
  it("collects game links and skips Game Pass itself", () => {
    const html = `
      <a href="https://www.xbox.com/en-US/games/store/the-alters/9n0p25wjhm8c">The Alters</a>
      <a href="https://www.xbox.com/en-US/games/store/the-alters/9n0p25wjhm8c?ocid=x">again</a>
      <a href="https://www.xbox.com/en-us/games/store/xbox-game-pass-ultimate/cfq7ttc0khs0">GPU</a>`;
    expect(extractStoreProductIds(html)).toEqual(["9N0P25WJHM8C"]);
  });
});

// Shaped like an Xbox Wire Free Play Days post, trimmed
const post = `
<script type="application/ld+json">{"datePublished":"2026-10-15T15:01:00+00:00"}</script>
<a href="https://www.xbox.com/en-us/games/store/xbox-game-pass-ultimate/cfq7ttc0khs0">Join</a>
<article>
  <p>Crusader Kings III and Ravenswatch are available this weekend for XBOX Game Pass Ultimate,
  Premium and Essential members to play from Thursday , October 15 until Sunday , October 18 .
  The Alters will have a free 3-hour timed trial from Thursday, October 15 until Sunday, October 18.</p>
  <h2 id="h-how-to-start-playing">How to Start Playing</h2>
  <a href="https://www.xbox.com/en-US/games/store/promo-game/9NBLGGH4R315">Also on sale</a>
  <h2 id="h-free-play-days-game-pass-membership-required">Free Play Days (Game Pass Membership Required)</h2>
  <h2>Crusader Kings III</h2>
  <a href="https://www.xbox.com/en-US/games/store/crusader-kings-iii/9mz8rzsd0nfq">Get it</a>
  <h2>Ravenswatch</h2>
  <a href="https://www.xbox.com/en-US/games/store/ravenswatch/9p4nx9rd7frg">Get it</a>
  <h2 id="h-free-play-days-for-all">Free Play Days For All</h2>
  <h2>The Alters</h2>
  <a href="https://www.xbox.com/en-US/games/store/the-alters/9n0p25wjhm8c">Get it</a>
</article>
<a href="https://www.xbox.com/en-US/games/store/sidebar-game/9NBLGGH4NNS1">Trending</a>`;

describe("parseFreePlayDaysPost", () => {
  it("reads the games, who can play them and the weekend's dates", () => {
    const parsed = parseFreePlayDaysPost(post);

    expect(parsed.games).toEqual([
      { productId: "9MZ8RZSD0NFQ", membershipRequired: true },
      { productId: "9P4NX9RD7FRG", membershipRequired: true },
      { productId: "9N0P25WJHM8C", membershipRequired: false },
    ]);
    // Thursday 00:00 to Sunday 23:59, Pacific daylight time (UTC-7)
    expect(parsed.startDate.toISOString()).toBe("2026-10-15T07:00:00.000Z");
    expect(parsed.endDate.toISOString()).toBe("2026-10-19T06:59:00.000Z");
  });

  it("falls back to the Sunday after publishing when the post has no dates", () => {
    const parsed = parseFreePlayDaysPost(
      `<script>{"datePublished":"2026-10-15T15:01:00+00:00"}</script>
       <article><a href="https://www.xbox.com/en-US/games/store/a/9N0P25WJHM8C">A</a></article>`,
    );

    expect(parsed.games).toEqual([
      { productId: "9N0P25WJHM8C", membershipRequired: null },
    ]);
    expect(parsed.startDate.toISOString()).toBe("2026-10-15T15:01:00.000Z");
    expect(parsed.endDate.toISOString()).toBe("2026-10-19T06:59:00.000Z");
  });
});
