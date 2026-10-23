import { describe, expect, it } from "vitest";
import { hasRealEndDate, providerLogo, storeCallToAction } from "./labels";

describe("hasRealEndDate", () => {
  it("is true for stores that publish a deadline", () => {
    expect(hasRealEndDate("epic_games")).toBe(true);
    expect(hasRealEndDate("xbox_free_play_days")).toBe(true);
  });

  it("is false for feeds with estimated or rolling end dates", () => {
    expect(hasRealEndDate("xbox_game_pass")).toBe(false);
    expect(hasRealEndDate("nintendo_switch_online")).toBe(false);
    expect(hasRealEndDate("playstation")).toBe(false);
    expect(hasRealEndDate("humble_bundle")).toBe(false);
  });
});

describe("storeCallToAction", () => {
  it("names the store", () => {
    expect(storeCallToAction("steam")).toBe("Get it on Steam");
    expect(storeCallToAction("epic_games")).toBe("Get it on Epic Games");
  });

  it("uses service-specific wording", () => {
    expect(storeCallToAction("xbox_game_pass")).toBe("Play with Game Pass");
    expect(storeCallToAction("nintendo_switch_online")).toBe(
      "Try it on Nintendo eShop",
    );
  });

  it("falls back for unknown stores", () => {
    expect(storeCallToAction("unknown")).toBe("Get it on the store");
  });
});

describe("providerLogo", () => {
  it("uses the dark-background logo", () => {
    expect(providerLogo("playstation")).toBe(
      "/images/icons/provider_logos/logo_playstation.svg",
    );
  });

  it("reuses platform logos for services without their own", () => {
    expect(providerLogo("xbox_game_pass")).toBe(providerLogo("xbox"));
    expect(providerLogo("nintendo_eshop")).toMatch(/nintendo_switch/);
  });
});
