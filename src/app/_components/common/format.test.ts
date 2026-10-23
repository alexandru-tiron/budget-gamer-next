import { describe, expect, it } from "vitest";

import { formatDate } from "./format";

describe("formatDate", () => {
  it("formats day, month and year with leading zeros", () => {
    expect(formatDate(new Date(2026, 0, 5, 9, 7))).toBe("05/01/2026");
  });

  it("adds the 24-hour time when asked", () => {
    expect(formatDate(new Date(2026, 10, 23, 18, 30), true)).toBe(
      "23/11/2026 18:30",
    );
    expect(formatDate(new Date(2026, 10, 23, 0, 5), true)).toBe(
      "23/11/2026 00:05",
    );
  });
});
