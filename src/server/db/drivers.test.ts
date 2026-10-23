import { describe, expect, it } from "vitest";

import { resolveDatabaseDriver } from "./drivers";
import { assertLocalDatabaseUrl } from "./testing";

describe("resolveDatabaseDriver", () => {
  it("uses the HTTP driver for Neon hosts", () => {
    expect(
      resolveDatabaseDriver(
        "postgresql://user:pass@ep-cool-name-123456.eu-central-1.aws.neon.tech/db?sslmode=require",
      ),
    ).toBe("neon-http");
  });

  it("uses a regular connection for other hosts", () => {
    expect(
      resolveDatabaseDriver("postgresql://postgres:password@localhost:5432/db"),
    ).toBe("postgres");
    expect(
      resolveDatabaseDriver("postgresql://u:p@db.example.com/neon.tech"),
    ).toBe("postgres");
  });

  it("lets DATABASE_DRIVER override the guess", () => {
    expect(
      resolveDatabaseDriver("postgresql://u:p@localhost/db", "neon-http"),
    ).toBe("neon-http");
    expect(
      resolveDatabaseDriver("postgresql://u:p@x.neon.tech/db", "postgres"),
    ).toBe("postgres");
  });
});

describe("assertLocalDatabaseUrl", () => {
  it("accepts local servers", () => {
    expect(() =>
      assertLocalDatabaseUrl(
        "postgresql://postgres:postgres@localhost:5432/test",
      ),
    ).not.toThrow();
    expect(() =>
      assertLocalDatabaseUrl("postgresql://postgres:postgres@127.0.0.1/test"),
    ).not.toThrow();
  });

  it("refuses remote databases", () => {
    expect(() =>
      assertLocalDatabaseUrl("postgresql://u:p@ep-1.aws.neon.tech/db"),
    ).toThrow(/Refusing/);
  });
});
