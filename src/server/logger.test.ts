import { describe, expect, it } from "vitest";

import { formatEntry, serializeError } from "./logger";

describe("serializeError", () => {
  it("keeps the name, message and cause of errors", () => {
    const error = new Error("outer", { cause: new TypeError("inner") });
    expect(serializeError(error)).toMatchObject({
      name: "Error",
      message: "outer",
      cause: { name: "TypeError", message: "inner" },
    });
  });

  it("leaves other values alone", () => {
    expect(serializeError("text")).toBe("text");
  });
});

describe("formatEntry", () => {
  it("builds a JSON-friendly entry", () => {
    const entry = formatEntry(
      "error",
      "Request failed",
      { scope: "cron", error: new Error("boom") },
      new Date("2026-01-01T00:00:00Z"),
    );

    expect(entry).toMatchObject({
      level: "error",
      time: "2026-01-01T00:00:00.000Z",
      msg: "Request failed",
      scope: "cron",
      error: { message: "boom" },
    });
    expect(() => JSON.stringify(entry)).not.toThrow();
    expect(JSON.parse(JSON.stringify(entry))).toHaveProperty(
      "error.message",
      "boom",
    );
  });
});
