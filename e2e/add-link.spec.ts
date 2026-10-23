import { expect, test } from "@playwright/test";

// Only links that fail validation are submitted here, so the tests never reach store sites

test("explains why an unsupported game link was rejected", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Add a free game" }).click();
  const dialog = page.getByRole("dialog", { name: "Add a free game" });
  await dialog
    .getByLabel("Store page link")
    .fill("https://example.com/some-game");
  await dialog.getByRole("button", { name: "Submit" }).click();

  await expect(dialog.getByRole("status")).toHaveText(/Unsupported link/);
});

test("rejects giveaway links from unsupported sites", async ({ page }) => {
  await page.goto("/articles");

  await page.getByRole("button", { name: "Add an article link" }).click();
  const dialog = page.getByRole("dialog", { name: "Add an article link" });
  await dialog
    .getByLabel("Giveaway article link")
    .fill("https://evil.com/?next=reddit.com/r/free");
  await dialog.getByRole("button", { name: "Submit" }).click();

  await expect(dialog.getByRole("status")).toHaveText(/aren't supported/);
});
