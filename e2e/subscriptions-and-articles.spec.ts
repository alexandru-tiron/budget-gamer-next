import { expect, test } from "@playwright/test";

import {
  activeArticle,
  expiredArticle,
  subscriptionFixtures,
} from "./fixtures";

test("groups subscription games by service", async ({ page }) => {
  await page.goto("/timed");

  await expect(
    page.getByRole("heading", { level: 1, name: "Timed" }),
  ).toBeVisible();
  for (const { name, section } of Object.values(subscriptionFixtures)) {
    const region = page.getByRole("region", { name: section });
    await expect(
      region.getByRole("button", { name: new RegExp(name) }),
    ).toBeVisible();
  }
});

test("lists active giveaways that open in a new tab", async ({ page }) => {
  await page.goto("/articles");

  const link = page.getByRole("link", {
    name: new RegExp(activeArticle.title),
  });
  await expect(link).toHaveAttribute("href", activeArticle.link);
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(page.getByText(expiredArticle.title)).toHaveCount(0);
});
