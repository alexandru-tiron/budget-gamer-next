# Self-hosting Budget Gamer

Budget Gamer runs on Vercel out of the box, but it also runs anywhere Node.js or containers do.
Pick the option that fits:

- [Docker Compose](#docker-compose): one machine, everything included (Postgres, scrapers, schedule)
- [Docker image](#docker-image): bring your own database and scheduler
- [Kubernetes](#kubernetes): manifests in [`deploy/kubernetes`](../deploy/kubernetes)
- [Custom server](#custom-server-without-docker): plain Node.js behind a reverse proxy

Every option needs the same things:

| Need                  | Why                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------- |
| Postgres 14+          | Any Postgres works; Neon URLs use Neon's HTTP driver, others a regular connection      |
| Chromium              | The Amazon, GOG, Humble, PlayStation and Steam scrapers drive a headless browser       |
| A scheduler           | Something must call `/api/cron/daily` and `/api/cron/thursday` (Vercel Cron does this on Vercel) |
| `CRON_SECRET`         | Shared secret the scheduler sends as `Authorization: Bearer <CRON_SECRET>`             |
| `REDDIT_AUTH_TOKEN`   | Basic-auth token for Reddit's API, used by the daily giveaway search                   |

## Environment variables

| Variable                   | Required | Description                                                                          |
| -------------------------- | -------- | ------------------------------------------------------------------------------------ |
| `DATABASE_URL`             | yes      | Postgres connection string                                                           |
| `CRON_SECRET`              | yes      | Secret for the cron endpoints; use a long random string                               |
| `REDDIT_AUTH_TOKEN`        | yes      | Reddit API token                                                                      |
| `DATABASE_DRIVER`          | no       | `neon-http` or `postgres`; guessed from the URL when unset                            |
| `CHROMIUM_EXECUTABLE_PATH` | no       | Path to an installed Chromium. Set in the Docker image to `/usr/bin/chromium`         |
| `CHROMIUM_PACK_URL`        | no       | Chromium pack to download on Linux when no executable path is set (serverless setups) |
| `LOG_LEVEL`                | no       | `debug`, `info` (default in production), `warn` or `error`                            |
| `PORT`, `HOSTNAME`         | no       | Where the server listens (the image uses `3000` and `0.0.0.0`)                         |

Logs are JSON lines on stdout/stderr, with a `scope` field such as `cron`, `trpc` or `epic-games`.

## Health checks

| Endpoint                | Checks                       | Use for                          |
| ----------------------- | ---------------------------- | -------------------------------- |
| `GET /api/health`       | The server responds          | Liveness, container health check |
| `GET /api/health/ready` | The database is reachable    | Readiness, load balancers        |

`/api/health/ready` answers `503` while the database is down.

## Docker Compose

[`compose.yaml`](../compose.yaml) runs the whole stack on one machine:

- `db`: Postgres 17 with a named volume
- `migrate`: applies the migrations, then exits
- `app`: the production image, published on `127.0.0.1:3000`
- `scheduler`: a tiny Alpine container whose cron calls the app on the Vercel schedule (UTC)

1. Create `.env` next to `compose.yaml`:

   ```bash
   POSTGRES_PASSWORD=a-strong-password
   CRON_SECRET=a-long-random-string
   REDDIT_AUTH_TOKEN=your-reddit-token
   # APP_PORT=3000
   ```

2. Build and start it. `-f compose.yaml` skips the development overrides in `compose.override.yaml`:

   ```bash
   docker compose -f compose.yaml up -d --build
   ```

3. Check it:

   ```bash
   docker compose -f compose.yaml ps
   curl http://127.0.0.1:3000/api/health/ready
   ```

4. Put a reverse proxy with TLS in front of `127.0.0.1:3000` (see [Caddy](#reverse-proxy)).

To run a scrape right away instead of waiting for the schedule:

```bash
docker compose -f compose.yaml exec scheduler sh -c 'wget -qO- --header "Authorization: Bearer $CRON_SECRET" http://app:3000/api/cron/thursday'
```

To upgrade, pull the new code and run the same `up -d --build` command; `migrate` runs again
before the app starts. Database data lives in the `db-data` volume and survives
`docker compose down`. Only `docker compose down -v` deletes it.

To use an external database such as Neon instead of the bundled one, remove the `db` service and
the `depends_on` entries that point at it, and set `DATABASE_URL` for `migrate` and `app`.

### Development with Compose

`docker compose up` (without `-f`) also loads [`compose.override.yaml`](../compose.override.yaml):
the app runs `next dev`, Postgres is published on `127.0.0.1:5432`, and the scheduler stays off
(add `--profile scheduler` to start it).

```bash
docker compose up --build --watch   # edits in src/ and public/ sync into the container
docker compose up -d db             # only Postgres, for `npm run dev` on the host
```

## Docker image

The [`Dockerfile`](../Dockerfile) has three targets:

| Target                 | Contents                                                                 |
| ---------------------- | ------------------------------------------------------------------------ |
| `production` (default) | Next.js standalone server plus Chromium, runs as the non-root `node` user |
| `migrate`              | Runs `drizzle-kit migrate` against `DATABASE_URL`                        |
| `dev`                  | `next dev` with all dependencies, for Compose                            |

```bash
docker build -t budget-gamer .
docker build -t budget-gamer-migrate --target migrate .

docker run --rm -e DATABASE_URL=... budget-gamer-migrate
docker run -d -p 127.0.0.1:3000:3000 \
  -e DATABASE_URL=... -e CRON_SECRET=... -e REDDIT_AUTH_TOKEN=... \
  budget-gamer
```

The image is built without a database, so pages render on each request instead of being
prerendered at build time. That also keeps several replicas consistent without a shared cache.

Images aren't published anywhere yet. To use them on another machine or cluster, push them to a
registry you control:

```bash
docker tag budget-gamer ghcr.io/<you>/budget-gamer:0.1.0
docker push ghcr.io/<you>/budget-gamer:0.1.0
```

## Kubernetes

[`deploy/kubernetes`](../deploy/kubernetes) is a Kustomize base with:

- a `Deployment` (2 replicas, liveness and readiness probes, non-root, 1 GiB memory limit)
- a `Service` on port 80
- a `Job` that runs the migrations
- two `CronJob`s that call the cron endpoints on the Vercel schedule

It expects an external Postgres database (Neon or a managed Postgres).

1. Build and push both images (see above), then set their names and tags under `images:` in
   [`kustomization.yaml`](../deploy/kubernetes/kustomization.yaml).
2. Create the namespace and the secret. Copy
   [`secret.example.env`](../deploy/kubernetes/secret.example.env) to `secret.env` (it's
   gitignored) and fill it in:

   ```bash
   kubectl create namespace budget-gamer
   kubectl -n budget-gamer create secret generic budget-gamer --from-env-file=deploy/kubernetes/secret.env
   ```

3. Apply it:

   ```bash
   kubectl apply -k deploy/kubernetes
   kubectl -n budget-gamer wait --for=condition=complete job/budget-gamer-migrate --timeout=5m
   kubectl -n budget-gamer rollout status deployment/budget-gamer
   ```

4. Expose the `budget-gamer` service with your ingress controller or gateway.

For each new release, update the image tags, delete the finished migration job (jobs can't be
changed after they're created), and apply again:

```bash
kubectl -n budget-gamer delete job budget-gamer-migrate --ignore-not-found
kubectl apply -k deploy/kubernetes
```

To trigger a scrape by hand: `kubectl -n budget-gamer create job --from=cronjob/budget-gamer-cron-thursday manual-thursday`.

## Custom server (without Docker)

This runs the app with plain Node.js, for example on a VPS.

1. Install Node.js 22.19+, Chromium and Postgres (or use a hosted database). On Debian or Ubuntu:

   ```bash
   sudo apt-get install -y chromium
   ```

2. Get the code, install dependencies and configure it:

   ```bash
   git clone https://github.com/alexandru-tiron/budget-gamer-next.git /opt/budget-gamer
   cd /opt/budget-gamer
   npm ci
   cp .env.example .env   # set DATABASE_URL, CRON_SECRET, REDDIT_AUTH_TOKEN
   echo 'CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium' >> .env
   ```

3. Apply the migrations, then build a standalone server. With the database reachable, the pages
   are prerendered and refreshed hourly and after every cron run:

   ```bash
   set -a; . ./.env; set +a   # export the variables for drizzle-kit
   npm run db:migrate
   NEXT_OUTPUT=standalone npm run build
   cp -r public .next/standalone/public
   cp -r .next/static .next/standalone/.next/static
   ```

4. Run it with systemd. Save this as `/etc/systemd/system/budget-gamer.service`, then run
   `sudo systemctl enable --now budget-gamer`:

   ```ini
   [Unit]
   Description=Budget Gamer
   After=network-online.target

   [Service]
   User=budget-gamer
   WorkingDirectory=/opt/budget-gamer/.next/standalone
   EnvironmentFile=/opt/budget-gamer/.env
   Environment=NODE_ENV=production PORT=3000 HOSTNAME=127.0.0.1
   ExecStart=/usr/bin/node server.js
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```

5. Schedule the scrapers with the system crontab (`crontab -e`, times in the server's time zone;
   set `CRON_TZ=UTC` first if your cron supports it):

   ```cron
   CRON_TZ=UTC
   5 19 * * 4 curl -fsS -m 900 -H "Authorization: Bearer YOUR_CRON_SECRET" http://127.0.0.1:3000/api/cron/thursday
   0 0 * * *  curl -fsS -m 900 -H "Authorization: Bearer YOUR_CRON_SECRET" http://127.0.0.1:3000/api/cron/daily
   ```

6. Add a reverse proxy with TLS (below).

### Reverse proxy

With [Caddy](https://caddyserver.com), which also gets the TLS certificate:

```caddyfile
budget-gamer.example.com {
	reverse_proxy 127.0.0.1:3000
}
```

Keep the app bound to `127.0.0.1` so only the proxy can reach it.
