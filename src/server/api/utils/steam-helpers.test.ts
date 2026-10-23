import { describe, expect, it } from "vitest";

import { extractSteamAppId, parseSteamEndDate } from "./steam-helpers";

describe("parseSteamEndDate", () => {
  const now = new Date("2026-11-01T12:00:00Z");

  it("parses month-first dates in Pacific time", () => {
    expect(
      parseSteamEndDate(
        "Free to keep when you get it before Nov 7 @ 10:00am.",
        now,
      ),
    ).toBe(Date.UTC(2026, 10, 7, 18, 0)); // 10am PST = 18:00 UTC
  });

  it("parses day-first dates", () => {
    expect(
      parseSteamEndDate(
        "Free to keep when you get it before 7 Nov @ 10:00am.",
        now,
      ),
    ).toBe(Date.UTC(2026, 10, 7, 18, 0));
  });

  it("handles daylight saving time", () => {
    expect(
      parseSteamEndDate(
        "Free to keep when you get it before Jul 4 @ 10:00am.",
        new Date("2026-07-01T00:00:00Z"),
      ),
    ).toBe(Date.UTC(2026, 6, 4, 17, 0)); // 10am PDT = 17:00 UTC
  });

  it("handles pm, noon and midnight", () => {
    expect(parseSteamEndDate("before Nov 7 @ 6:30pm", now)).toBe(
      Date.UTC(2026, 10, 8, 2, 30),
    );
    expect(parseSteamEndDate("before Nov 7 @ 12:00pm", now)).toBe(
      Date.UTC(2026, 10, 7, 20, 0),
    );
    expect(parseSteamEndDate("before Nov 7 @ 12:00am", now)).toBe(
      Date.UTC(2026, 10, 7, 8, 0),
    );
  });

  it("rolls over to next year", () => {
    expect(
      parseSteamEndDate(
        "Free to keep when you get it before Jan 2 @ 10:00am.",
        new Date("2026-12-30T12:00:00Z"),
      ),
    ).toBe(Date.UTC(2027, 0, 2, 18, 0));
  });

  it("returns null for text it can't read", () => {
    expect(parseSteamEndDate("Offer ends soon", now)).toBeNull();
    expect(parseSteamEndDate("before Foo 7 @ 10:00am", now)).toBeNull();
  });
});

describe("extractSteamAppId", () => {
  it("reads the app id", () => {
    expect(
      extractSteamAppId("https://store.steampowered.com/app/1234/Game/"),
    ).toBe("1234");
    expect(extractSteamAppId("https://store.steampowered.com/")).toBeNull();
  });
});
