import { expect, test } from "@playwright/test";

test("keeps visited pages available offline", async ({ page, context }) => {
  await page.goto("/settings");

  // Load the page once more through the service worker so it gets cached
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => navigator.serviceWorker.controller !== null),
    )
    .toBe(true);

  await context.setOffline(true);
  try {
    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: "Settings" }),
    ).toBeVisible();

    // A page this browser never visited falls back to the offline page
    await page.goto("/articles");
    await expect(
      page.getByRole("heading", { name: "You're offline" }),
    ).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
