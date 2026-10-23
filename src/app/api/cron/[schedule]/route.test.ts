import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, maxDuration } from "./route";

const jobs = vi.hoisted(() => ({
  getAmazonPrimeGames: vi.fn<() => Promise<unknown>>(),
  getEpicFreeGames: vi.fn<() => Promise<unknown>>(),
  getXboxFreePlayDays: vi.fn<() => Promise<unknown>>(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("~/env", () => ({ env: { CRON_SECRET: "secret" } }));
vi.mock("~/server/api/trpc", () => ({ createTRPCContext: async () => ({}) }));
vi.mock("~/server/api/root", () => ({
  createCaller: () => ({ scheduled: jobs }),
}));
vi.mock("~/server/logger", () => ({
  logger: { child: () => ({ info: vi.fn(), error: vi.fn() }) },
}));

function run(path: string, secret = "secret") {
  const [schedule = ""] = path.split("?");
  return GET(
    new NextRequest(`http://localhost/api/cron/${path}`, {
      headers: { authorization: `Bearer ${secret}` },
    }),
    { params: Promise.resolve({ schedule }) },
  );
}

beforeEach(() => {
  jobs.getAmazonPrimeGames.mockResolvedValue({ total: 14 });
  jobs.getEpicFreeGames.mockResolvedValue({ total: 2 });
  jobs.getXboxFreePlayDays.mockResolvedValue({ total: 6 });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("cron route", () => {
  it("rejects requests without the cron secret", async () => {
    const response = await run("thursday", "wrong");
    expect(response.status).toBe(401);
    expect(jobs.getEpicFreeGames).not.toHaveBeenCalled();
  });

  it("runs every job of the schedule and refreshes the pages", async () => {
    const response = await run("thursday");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      successful: 3,
      failed: 0,
      results: { amazonPrime: { ok: true, result: { total: 14 } } },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/timed");
  });

  it("runs a single job with ?job=", async () => {
    const response = await run("thursday?job=amazonPrime");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      successful: 1,
      results: { amazonPrime: { ok: true } },
    });
    expect(jobs.getEpicFreeGames).not.toHaveBeenCalled();
  });

  it("lists the schedule's jobs when ?job= names an unknown one", async () => {
    const response = await run("thursday?job=psPlus");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: 'Unknown job "psPlus"',
      jobs: ["amazonPrime", "epicGames", "xboxFreePlayDays"],
    });
  });

  it("reports a job that runs out of time and keeps the others", async () => {
    vi.useFakeTimers();
    jobs.getAmazonPrimeGames.mockReturnValue(new Promise(() => undefined));

    const pending = run("thursday");
    await vi.advanceTimersByTimeAsync((maxDuration - 8) * 1000);
    const response = await pending;

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      successful: 2,
      failed: 1,
      results: {
        amazonPrime: { ok: false, error: "Timed out after 52s" },
        epicGames: { ok: true },
      },
    });
    // The pages still refresh with what the finished jobs saved
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });
});
