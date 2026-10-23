import { describe, expect, it } from "vitest";

import { normalizePlatformIds } from "./platforms";
import { parseGogCountdown } from "./gog-helpers";

describe("normalizePlatformIds", () => {
  it("maps store names to the app's ids", () => {
    expect(normalizePlatformIds(["windows", "mac", "linux"])).toEqual([
      "windows",
      "mac_os",
      "linux",
    ]);
  });

  it("strips trademark signs from every entry", () => {
    expect(normalizePlatformIds(["PS4™", "PS5™"])).toEqual(["ps4", "ps5"]);
  });

  it("drops duplicates and empty values", () => {
    expect(normalizePlatformIds(["mac", "mac_os", "", " Linux "])).toEqual([
      "mac_os",
      "linux",
    ]);
  });
});

describe("parseGogCountdown", () => {
  it("parses hours, minutes and seconds", () => {
    expect(parseGogCountdown("47 : 59 : 12")).toBe(
      47 * 3600000 + 59 * 60000 + 12 * 1000,
    );
    expect(parseGogCountdown("01:02:03")).toBe(3723000);
  });

  it("returns null for other text", () => {
    expect(parseGogCountdown("Giveaway ended")).toBeNull();
  });
});
