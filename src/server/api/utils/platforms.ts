// Store APIs name platforms differently; map them onto the ids the UI has icons for
const PLATFORM_ALIASES: Record<string, string> = {
  windows: "windows",
  win: "windows",
  pc: "windows",
  mac: "mac_os",
  macos: "mac_os",
  mac_os: "mac_os",
  osx: "mac_os",
  linux: "linux",
  ps4: "ps4",
  ps5: "ps5",
};

/**
 * Normalize platform names from the store APIs (e.g. "mac", "PS4™") into the ids used across
 * the app (e.g. "mac_os", "ps4"), dropping duplicates and empty values.
 */
export function normalizePlatformIds(platforms: string[]): string[] {
  const ids = platforms
    .map((platform) => platform.replace(/™/g, "").trim().toLowerCase())
    .filter((platform) => platform.length > 0)
    .map((platform) => PLATFORM_ALIASES[platform] ?? platform);

  return [...new Set(ids)];
}
