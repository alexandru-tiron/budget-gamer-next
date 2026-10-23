import { describe, expect, it } from "vitest";

import {
  extractDomain,
  getArticleSource,
  getDefaultCoverImage,
  isAllowedDomain,
} from "./url-helpers";

describe("isAllowedDomain", () => {
  it.each([
    "https://www.reddit.com/r/FreeGameFindings/comments/abc/",
    "https://old.reddit.com/r/GiftofGames/",
    "https://twitter.com/user/status/1",
    "https://x.com/user/status/1",
    "https://www.humblebundle.com/store/game",
    "https://gleam.io/abc/giveaway",
    "http://facebook.com/events/1",
  ])("allows %s", (url) => {
    expect(isAllowedDomain(url)).toBe(true);
  });

  it.each([
    "https://evil.com/?reddit.com/",
    "https://evil.com/reddit.com/r/x",
    "https://reddit.com.evil.com/r/x",
    "https://notreddit.com/r/x",
    "http://169.254.169.254/latest/meta-data?reddit.com/",
    "ftp://reddit.com/r/x",
    "javascript:alert('reddit.com/')",
    "not a url",
  ])("rejects %s", (url) => {
    expect(isAllowedDomain(url)).toBe(false);
  });
});

describe("getArticleSource", () => {
  it("maps x.com to twitter", () => {
    expect(getArticleSource("https://x.com/a/status/1")).toBe("twitter");
  });
});

describe("getDefaultCoverImage", () => {
  it("uses the local image for the source", () => {
    expect(getDefaultCoverImage("https://gleam.io/abc")).toBe(
      "/images/articles/gleam.jpg",
    );
    expect(getDefaultCoverImage("https://www.humblebundle.com/x")).toBe(
      "/images/articles/humbleBundle.jpg",
    );
  });

  it("falls back to the default image", () => {
    expect(getDefaultCoverImage("https://example.com")).toBe(
      "/images/articles/default.jpg",
    );
  });
});

describe("extractDomain", () => {
  it("strips a leading www only", () => {
    expect(extractDomain("https://www.reddit.com/r/x")).toBe("reddit.com");
    expect(extractDomain("https://gleam.io/www.x")).toBe("gleam.io");
  });
});
