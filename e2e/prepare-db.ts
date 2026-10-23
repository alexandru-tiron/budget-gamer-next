import { clearDatabase, openTestDatabase } from "~/server/db/testing";
import { seedDatabase } from "./fixtures";

// Migrates and seeds the database the end-to-end build will read. Playwright runs this before
// `next build`, because the pages are prerendered from whatever is in the database.

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL must point at the local end-to-end database");
}

// Throws before touching anything unless the database is local
const { db, close } = await openTestDatabase(url);
try {
  await clearDatabase(db);
  await seedDatabase(db);
  console.log("Seeded the end-to-end database");
} finally {
  await close();
}
