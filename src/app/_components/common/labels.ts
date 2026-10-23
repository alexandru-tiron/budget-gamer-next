// Display names and logos for the provider and platform ids stored in the database

export const PROVIDER_NAMES: Record<string, string> = {
  steam: "Steam",
  epic_games: "Epic Games",
  amazon_games: "Amazon Games",
  gog: "GOG",
  battle: "Battle.net",
  humble_bundle: "Humble Bundle",
  playstation: "PlayStation",
  xbox: "Xbox",
  xbox_game_pass: "Xbox Game Pass",
  xbox_free_play_days: "Xbox Free Play Days",
  nintendo_eshop: "Nintendo eShop",
  nintendo_switch_online: "Nintendo Switch Online",
};

export const PLATFORM_NAMES: Record<string, string> = {
  windows: "Windows",
  mac_os: "macOS",
  linux: "Linux",
  ps4: "PlayStation 4",
  ps5: "PlayStation 5",
  xbox_one: "Xbox One",
  xbox_classic: "Xbox Classic",
  xbox_series: "Xbox Series X|S",
  nintendo_switch: "Nintendo Switch",
  nintendo_switch_2: "Nintendo Switch 2",
};

export const FALLBACK_COVER =
  "/images/draws/empty_drawable.imageset/empty_drawable.svg";

const PROVIDER_LOGOS = "/images/icons/provider_logos";
const PLATFORM_LOGOS = "/images/icons/platforms_logos";

// Services without artwork of their own reuse their platform's logo
const XBOX_LOGO = `${PROVIDER_LOGOS}/logo_xbox.svg`;
const NINTENDO_LOGO = `${PLATFORM_LOGOS}/logo_nintendo_switch_timed.svg`;
const PROVIDER_LOGO_OVERRIDES: Record<string, string> = {
  xbox_game_pass: XBOX_LOGO,
  xbox_free_play_days: XBOX_LOGO,
  nintendo_eshop: NINTENDO_LOGO,
  nintendo_switch_online: NINTENDO_LOGO,
};

/**
 * Logo for a store, made for dark backgrounds (the "_black" files are for light ones).
 */
export function providerLogo(providerId: string): string {
  return (
    PROVIDER_LOGO_OVERRIDES[providerId] ??
    `${PROVIDER_LOGOS}/logo_${providerId}.svg`
  );
}

// Feeds whose end dates are estimates or rolling windows rather than real deadlines
const ESTIMATED_END_DATES = new Set([
  "xbox_game_pass",
  "nintendo_switch_online",
  "humble_bundle",
  "playstation",
]);

/**
 * Whether a listing's end date is a real deadline worth counting down to.
 */
export function hasRealEndDate(providerId: string): boolean {
  return !ESTIMATED_END_DATES.has(providerId);
}

/**
 * Call to action for a store link, e.g. "Get it on Steam" or "Play with Game Pass".
 */
export function storeCallToAction(providerId: string): string {
  switch (providerId) {
    case "xbox_game_pass":
      return "Play with Game Pass";
    case "xbox_free_play_days":
      return "Play free this weekend";
    case "nintendo_switch_online":
      return "Try it on Nintendo eShop";
    case "playstation":
      return "Get it on PlayStation Store";
    default:
      return `Get it on ${PROVIDER_NAMES[providerId] ?? "the store"}`;
  }
}

// Switch 2 has no icon of its own yet
const PLATFORM_ICON_OVERRIDES: Record<string, string> = {
  nintendo_switch_2: "nintendo_switch",
};

/**
 * Icon for a platform. Render it with `brightness-0 invert` so every icon shows as a white
 * glyph on the dark cards, whatever its original colours.
 */
export function platformIcon(platform: string): string {
  return `${PLATFORM_LOGOS}/logo_${PLATFORM_ICON_OVERRIDES[platform] ?? platform}.svg`;
}
