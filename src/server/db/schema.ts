// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { index, pgTableCreator } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator(
  (name) => `budget-gamer-next_${name}`,
);

export const freeGames = createTable(
  "free_games",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.text().notNull(),
    cover: d.text().notNull(),
    cover_portrait: d.text().notNull(),
    description: d.text().notNull(),
    developer: d.text().notNull(),
    start_date: d.timestamp({ withTimezone: true }).notNull(),
    end_date: d.timestamp({ withTimezone: true }).notNull(),
    free: d.boolean().notNull(),
    platform_ids: d.text().array().notNull(),
    provider_id: d.text().notNull(),
    provider_url: d.text().notNull(),
    publisher: d.text(),
    release_date: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("free_games_name_idx").on(t.name),
    index("free_games_start_date_idx").on(t.start_date),
    index("free_games_end_date_idx").on(t.end_date),
  ],
);

export const subscriptionGames = createTable(
  "subscription_games",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.text().notNull(),
    cover: d.text().notNull(),
    cover_portrait: d.text().notNull(),
    description: d.text().notNull(),
    developer: d.text().notNull(),
    start_date: d.timestamp({ withTimezone: true }).notNull(),
    end_date: d.timestamp({ withTimezone: true }).notNull(),
    platform_ids: d.text().array().notNull(),
    provider_id: d.text().notNull(),
    provider_url: d.text().notNull(),
    publisher: d.text(),
    release_date: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("subscription_games_name_idx").on(t.name),
    index("subscription_games_start_date_idx").on(t.start_date),
    index("subscription_games_end_date_idx").on(t.end_date),
  ],
);

export const articles = createTable(
  "articles",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    title: d.text().notNull(),
    description: d.text().notNull(),
    cover: d.text().notNull(),
    link: d.text().notNull(),
    domain: d.text().notNull(),
    start_date: d.timestamp({ withTimezone: true }).notNull(),
    end_date: d.timestamp({ withTimezone: true }).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("articles_title_idx").on(t.title),
    index("articles_createdAt_idx").on(t.createdAt),
  ],
);
