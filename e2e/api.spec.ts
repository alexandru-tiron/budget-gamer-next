import { expect, test } from "@playwright/test";

import { E2E_CRON_SECRET } from "./constants";
import { epicGame, steamGame } from "./fixtures";

interface TrpcResponse<T> {
  result: { data: { json: T } };
}

test("serves running offers over tRPC", async ({ request }) => {
  const response = await request.get("/api/trpc/freeGames.getAvailableGames");
  expect(response.ok()).toBe(true);

  const body = (await response.json()) as TrpcResponse<{ name: string }[]>;
  expect(body.result.data.json.map((game) => game.name)).toEqual([
    steamGame.name,
    epicGame.name,
  ]);
});

test("refuses internal procedures over HTTP", async ({ request }) => {
  for (const path of [
    "scheduled.getPSPlusGames",
    "subscriptionGames.createSubscriptionGame",
    "freeGames.createFreeGame",
  ]) {
    const response = await request.post(`/api/trpc/${path}`, {
      data: { json: {} },
    });
    expect(response.status(), path).toBe(403);
  }
});

test("guards the cron endpoints", async ({ request }) => {
  expect((await request.get("/api/cron/daily")).status()).toBe(401);
  expect(
    (
      await request.get("/api/cron/daily", {
        headers: { authorization: "Bearer wrong-secret" },
      })
    ).status(),
  ).toBe(401);
  // A valid secret with an unknown schedule runs nothing
  expect(
    (
      await request.get("/api/cron/unknown", {
        headers: { authorization: `Bearer ${E2E_CRON_SECRET}` },
      })
    ).status(),
  ).toBe(404);
});
