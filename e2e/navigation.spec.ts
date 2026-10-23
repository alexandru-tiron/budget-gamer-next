import { expect, test } from "@playwright/test";

const PAGES = [
  { label: "Timed", path: "/timed", title: "Timed" },
  { label: "Articles", path: "/articles", title: "Articles" },
  { label: "Settings", path: "/settings", title: "Settings" },
  { label: "Home", path: "/", title: "Free Games" },
];

test("moves between pages with the main navigation", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });

  for (const target of PAGES) {
    await nav.getByRole("link", { name: target.label }).click();
    await expect(page).toHaveURL(new RegExp(`${target.path}$`));
    await expect(
      page.getByRole("heading", { level: 1, name: target.title }),
    ).toBeVisible();
    await expect(nav.getByRole("link", { name: target.label })).toHaveAttribute(
      "aria-current",
      "page",
    );
  }
});

test("skip link moves focus to the main content", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("settings panels open and close from the keyboard", async ({ page }) => {
  await page.goto("/settings");

  const about = page.getByRole("button", { name: "About App" });
  await about.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "About App" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Welcome to Budget Gamer!" }),
  ).toBeVisible();

  await dialog.getByRole("button", { name: "Close panel" }).click();
  await expect(dialog).toBeHidden();
  await expect(about).toBeFocused();
});

test("unknown pages show a not-found message", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);

  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to free games" }).click();
  await expect(page).toHaveURL(/\/$/);
});
