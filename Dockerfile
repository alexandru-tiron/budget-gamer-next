# syntax=docker/dockerfile:1

# Targets:
#   production (default)  the app, served by Next.js' standalone server
#   migrate               applies the migrations in drizzle/ to DATABASE_URL
#   dev                   live-reloading dev server (used by compose.yaml)
#
# Pin a digest (node:22-bookworm-slim@sha256:...) for fully reproducible builds.
ARG NODE_IMAGE=node:22-bookworm-slim

# ---- Shared settings ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    PUPPETEER_SKIP_DOWNLOAD=true

# ---- Runtime base with Chromium for the scrapers -------------------------------------------------
FROM base AS chromium
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean && \
    apt-get update && \
    apt-get install -y --no-install-recommends chromium fonts-liberation ca-certificates
ENV CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium

# ---- All dependencies (dev ones are needed to build) ---------------------------------------------
FROM base AS deps
# Private registries: docker buildx build --secret id=npmrc,src="$HOME/.npmrc" .
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    --mount=type=secret,id=npmrc,target=/root/.npmrc,required=false \
    npm ci

# ---- Development server (compose.override.yaml syncs source changes in with Compose Watch) -------
FROM chromium AS dev
COPY --link --from=deps --chown=1000:1000 /app/node_modules ./node_modules
COPY --link --chown=1000:1000 . .
# Next.js writes .next/ into the working directory
RUN chown 1000:1000 /app
USER node
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

# ---- Production build ----------------------------------------------------------------------------
FROM deps AS build
COPY --link . .
# There is no database or secret at build time: skip env validation, give the database client a
# placeholder URL (it never connects) and render pages per request instead of prerendering them.
ENV NEXT_OUTPUT=standalone \
    BUILD_WITHOUT_DATABASE=1 \
    SKIP_ENV_VALIDATION=1 \
    DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN npm run build

# ---- Database migrations -------------------------------------------------------------------------
FROM deps AS migrate
COPY --link drizzle.config.ts tsconfig.json ./
COPY --link drizzle ./drizzle
COPY --link src/env.js ./src/env.js
COPY --link src/server/db/schema.ts ./src/server/db/schema.ts
# Only DATABASE_URL is needed to migrate
ENV SKIP_ENV_VALIDATION=1
USER node
CMD ["npx", "drizzle-kit", "migrate"]

# ---- Production runtime --------------------------------------------------------------------------
FROM chromium AS production
LABEL org.opencontainers.image.source="https://github.com/alexandru-tiron/budget-gamer-next" \
      org.opencontainers.image.description="Budget Gamer: track free games across stores" \
      org.opencontainers.image.licenses="MIT"
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --link --from=build --chown=1000:1000 /app/public ./public
COPY --link --from=build --chown=1000:1000 /app/.next/standalone ./
COPY --link --from=build --chown=1000:1000 /app/.next/static ./.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "server.js"]
