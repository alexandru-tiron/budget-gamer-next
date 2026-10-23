import { expect, test } from "@playwright/test";

import { epicGame, expiredGame, steamGame } from "./fixtures";

test.describe("free games", () => {
  test("lists running offers and hides expired ones", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 1, name: "Free Games" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: new RegExp(steamGame.name) }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: new RegExp(epicGame.name) }),
    ).toBeVisible();
    await expect(page.getByText(expiredGame.name)).toHaveCount(0);
  });

  test("shows the offer ending soonest first", async ({ page }) => {
    await page.goto("/");

    const cards = page.getByRole("main").getByRole("listitem");
    await expect(cards).toHaveCount(2);
    await expect(cards.first()).toContainText(steamGame.name);
    await expect(cards.last()).toContainText(epicGame.name);
  });

  test("filters by store and searches by name", async ({ page }) => {
    await page.goto("/");

    const cards = page.getByRole("main").getByRole("listitem");
    const stores = page.getByRole("group", { name: "Filter by store" });
    const epicFilter = stores.getByRole("button", { name: /Epic Games/ });

    await epicFilter.click();
    await expect(epicFilter).toHaveAttribute("aria-pressed", "true");
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText(epicGame.name);

    await stores.getByRole("button", { name: /^All/ }).click();
    await page
      .getByRole("searchbox", { name: "Search free games" })
      .fill("steam adventure");
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText(steamGame.name);
  });

  test("sorts games by name", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("combobox", { name: "Sort games" })
      .selectOption("name");
    const cards = page.getByRole("main").getByRole("listitem");
    await expect(cards.first()).toContainText(epicGame.name);
    await expect(cards.last()).toContainText(steamGame.name);
  });

  test("offers to clear filters when nothing matches", async ({ page }) => {
    await page.goto("/");

    const search = page.getByRole("searchbox", { name: "Search free games" });
    await search.fill("no such game");
    await expect(
      page.getByRole("heading", { name: "No games match" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(search).toHaveValue("");
    await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(2);
  });

  test("opens game details in a dialog that Escape closes", async ({
    page,
  }) => {
    await page.goto("/");

    const card = page.getByRole("button", { name: new RegExp(steamGame.name) });
    await card.click();

    const dialog = page.getByRole("dialog", { name: steamGame.name });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: steamGame.name }),
    ).toBeVisible();
    await expect(dialog.getByText(steamGame.developer)).toBeVisible();
    await expect(dialog.getByRole("list", { name: "Platforms" })).toContainText(
      "macOS",
    );
    await expect(
      dialog.getByRole("link", { name: /Get it on Steam/ }),
    ).toHaveAttribute("href", steamGame.provider_url);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(card).toBeFocused();
  });
});
