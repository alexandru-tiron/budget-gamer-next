import { describe, expect, it } from "vitest";

import { formatTimeLeft, isUrgent } from "./time-left";

const now = new Date("2026-10-23T12:00:00Z");
const inMinutes = (minutes: number) =>
  new Date(now.getTime() + minutes * 60_000);

describe("formatTimeLeft", () => {
  it.each([
    [3 * 24 * 60 + 4 * 60, "3d 4h left"],
    [2 * 24 * 60, "2d left"],
    [5 * 60 + 12, "5h 12m left"],
    [12, "12m left"],
    [0.5, "1m left"],
    [45 * 24 * 60, "6w left"],
    [-5, "Ended"],
  ])("formats %d minutes as %s", (minutes, text) => {
    expect(formatTimeLeft(inMinutes(minutes), now)).toBe(text);
  });
});

describe("isUrgent", () => {
  it("is true only in the last 24 hours", () => {
    expect(isUrgent(inMinutes(23 * 60), now)).toBe(true);
    expect(isUrgent(inMinutes(25 * 60), now)).toBe(false);
    expect(isUrgent(inMinutes(-1), now)).toBe(false);
  });
});
