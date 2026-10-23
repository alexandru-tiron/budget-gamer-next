import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    // Defaults to neon-http for *.neon.tech hosts and postgres for everything else
    DATABASE_DRIVER: z.enum(["neon-http", "postgres"]).optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    REDDIT_AUTH_TOKEN: z.string(),
    CRON_SECRET: z.string(),
    CHROMIUM_PACK_URL: z.string().url().optional(),
    // Use an installed Chromium instead of downloading one (set in the Docker image)
    CHROMIUM_EXECUTABLE_PATH: z.string().optional(),
    // Docker images are built without a database, so pages render per request instead
    BUILD_WITHOUT_DATABASE: z.enum(["0", "1"]).optional(),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_DRIVER: process.env.DATABASE_DRIVER,
    NODE_ENV: process.env.NODE_ENV,
    REDDIT_AUTH_TOKEN: process.env.REDDIT_AUTH_TOKEN,
    CRON_SECRET: process.env.CRON_SECRET,
    CHROMIUM_PACK_URL: process.env.CHROMIUM_PACK_URL,
    CHROMIUM_EXECUTABLE_PATH: process.env.CHROMIUM_EXECUTABLE_PATH,
    BUILD_WITHOUT_DATABASE: process.env.BUILD_WITHOUT_DATABASE,
    LOG_LEVEL: process.env.LOG_LEVEL,
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
