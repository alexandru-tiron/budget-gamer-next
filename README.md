# Budget Gamer

<div align="center">
  <img src="/public/images/icons/Color Favicon.svg" alt="Budget Gamer Logo" width="200"/>
  <h3>Never miss a free game again!</h3>
  <p>A web app to track and discover free games across multiple gaming platforms.</p>
  <p><a href="https://budget-gamer.vercel.app/">Live Demo</a></p>
</div>

## Project Evolution

Budget Gamer started as a vanilla JavaScript project using HTML, CSS, and Firebase services. It has now been completely revamped using modern web technologies to provide a better user experience and more maintainable codebase.

### Key Technology Changes

- **Frontend**: Migrated from vanilla JS/HTML/CSS to Next.js 16 with App Router
- **Backend**: Replaced Firebase with:
  - Vercel for hosting and serverless functions
  - Neon DB instead of Firebase Realtime Database
  - tRPC procedures instead of Firebase Functions
- **Styling**: Moved from CSS to Tailwind CSS
- **Type Safety**: Added TypeScript for better type safety and developer experience
- **Database ORM**: Using Drizzle ORM for type-safe database operations
- **API Layer**: Implemented tRPC for end-to-end type safety

## Features

- 🎮 Track free games across multiple platforms
- 🕒 Time-limited free game offers
- 🎁 Subscription-based free games (PS Plus, etc.)
- 🌙 Dark mode support
- 🔄 Regular updates for new free games
- 📱 Responsive design for all devices

## Tech Stack

- [Next.js](https://nextjs.org) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [tRPC](https://trpc.io) - End-to-end type-safe API
- [Drizzle](https://orm.drizzle.team) - Database ORM
- [Neon DB](https://neon.tech) - Serverless Postgres
- [Vercel](https://vercel.com) - Deployment and hosting

## Getting Started

### Prerequisites

- Node.js 22.19+
- npm
- A Postgres database: a Neon DB account, or a local Postgres (for example via Docker)
- A Vercel account (for deployment)

### Local Development

1. Clone the repository

```bash
git clone https://github.com/alexandru-tiron/budget-gamer-next.git
cd budget-gamer-next
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env
```

Fill in your environment variables in the .env file.

`DATABASE_URL` can point at Neon or at any Postgres server. Neon URLs (`*.neon.tech`) use Neon's
serverless HTTP driver; every other URL uses a regular Postgres connection. Set `DATABASE_DRIVER`
to `neon-http` or `postgres` to override this. To run Postgres locally in Docker, start the
Compose `db` service; it matches the `DATABASE_URL` and `POSTGRES_PASSWORD` in `.env.example`:

```bash
docker compose up -d db
```

To run the whole app in Docker instead, with edits in `src/` syncing into the container, use
`docker compose up --build --watch` and skip the next two steps (see
[docs/self-hosting.md](docs/self-hosting.md#development-with-compose)).

4. Set up the database

```bash
npm run db:migrate
```

5. Run the development server

```bash
npm run dev
```

The app should now be running at http://localhost:3000

### Database Management

- Generate migrations: `npm run db:generate`
- Apply migrations: `npm run db:migrate`
- Push schema changes without a migration: `npm run db:push`
- View database: `npm run db:studio`

### API

The tRPC procedures, cron endpoints and data types are documented in [docs/API.md](docs/API.md).

### Checks

- Lint, typecheck and unit tests: `npm run check`
- Unit tests only: `npm test`
- Database integration tests: `npm run test:db`
- End-to-end tests: `npm run test:e2e`

The database and end-to-end tests need a local Postgres database in `TEST_DATABASE_URL`
(default: `postgresql://postgres:postgres@localhost:5432/budget_gamer_test`). They delete its
data, so they refuse any host other than localhost. The end-to-end run migrates and seeds that
database, builds the app and starts it on port 3100 (`E2E_PORT` changes it). Install the browser
once with:

```bash
npx playwright install chromium
```

CI runs the lint, typecheck and unit tests on every push to `main` and on pull requests. A second
job runs the database and end-to-end tests against a Postgres service container and uploads the
Playwright report. A third builds the Docker images, starts the production Compose stack and
smoke-tests it.

## Deployment

The easiest way to deploy Budget Gamer is using Vercel:

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your environment variables (`DATABASE_URL`, `REDDIT_AUTH_TOKEN`, `CRON_SECRET`, and optionally `CHROMIUM_PACK_URL` and `LOG_LEVEL`)
4. Deploy!

### Scheduled updates

[vercel.json](vercel.json) defines two cron jobs, both served by `src/app/api/cron/[schedule]/route.ts`:

- `/api/cron/daily` (midnight UTC): Reddit giveaway articles, Humble Choice, PlayStation Plus, Xbox Game Pass additions, Xbox Free Play Days, Xbox giveaways and Nintendo Switch Online Game Trials
- `/api/cron/thursday` (19:05 UTC): Amazon Prime Gaming (now part of Amazon Luna), Epic Games and the new Xbox Free Play Days

Xbox and Nintendo use the European stores (Ireland, prices in EUR). What counts as free:

- **Free games** (free to keep): Xbox and Nintendo eShop games whose price drops to €0 from a paid price. Nintendo rarely does this, so eShop games are only checked when someone submits a link.
- **Timed**: Xbox Game Pass additions, Xbox Free Play Days weekends (some need Game Pass) and Nintendo Switch Online Game Trials. You can play these for a while but don't keep them.

Vercel authenticates them with `CRON_SECRET`. Each job gets 52 seconds, so one slow store can't stop the others from saving or the run from finishing within Vercel's 60-second limit. After each run, the cron route revalidates the pages; they also regenerate at least once an hour. Add `?job=<name>` to run a single job by hand (see [docs/API.md](docs/API.md#cron-endpoints)).

Most feeds are plain HTTP requests. The GOG, Humble and Steam scrapers use Puppeteer: locally they use Puppeteer's bundled Chrome. On Vercel they use [`@sparticuz/chromium-min`](https://github.com/Sparticuz/chromium), which downloads a Chromium pack on cold start (set `CHROMIUM_PACK_URL` to host your own copy). The Docker image ships Debian's Chromium and points `CHROMIUM_EXECUTABLE_PATH` at it.

### Self-hosting

Budget Gamer also runs without Vercel. [docs/self-hosting.md](docs/self-hosting.md) covers:

- **Docker Compose**: Postgres, migrations, the app and a cron scheduler on one machine (`docker compose -f compose.yaml up -d --build`)
- **Docker image**: the [`Dockerfile`](Dockerfile)'s `production` and `migrate` targets
- **Kubernetes**: a Kustomize base in [`deploy/kubernetes`](deploy/kubernetes) with a Deployment, Service, migration Job and CronJobs
- **Custom server**: a standalone Node.js build behind systemd and a reverse proxy

Health checks live at `/api/health` (liveness) and `/api/health/ready` (database reachable).

## TODO List

### Performance Improvements

- [x] Implement server-side rendering
- [x] Add route pre-fetching
- [x] Add loading states and skeletons
- [x] Optimize bundle size
- [x] Add service worker for offline support

### Features

- [x] Add game store parsers:
  - [x] Steam Store
  - [x] Epic Games Store
  - [x] PlayStation Store (PS Plus)
  - [x] Xbox Store
  - [x] Nintendo eShop
  - [x] GOG
- [x] Add subscription-based game tracking:
  - [x] PlayStation Plus
  - [x] Amazon Prime
  - [x] Humble Bundle
  - [x] Nintendo Online
  - [x] Xbox Game Pass and Free Play Days
- [x] Add dark mode support
- [x] Add responsive design
- [ ] Add authentication system
- [ ] Implement user preferences
- [ ] Add user notifications for new free games
- [ ] Implement game wishlists
- [ ] Add game recommendations

### Development

- [x] Set up Next.js with App Router
- [x] Implement tRPC procedures
- [x] Set up Neon DB integration
- [x] Configure Drizzle ORM
- [x] Add TypeScript support
- [x] Add Vercel cron jobs for regular updates
- [x] Implement error handling
- [x] Add logging system
- [ ] Set up monitoring and analytics
- [x] Add end-to-end testing
- [x] Improve TypeScript strictness
- [x] Add API documentation

### UI/UX

- [x] Implement modern UI design
- [x] Add side panel navigation
- [x] Create game card components
- [x] Add social sharing functionality
- [ ] Improve navigation
- [ ] Add more interactive elements
- [x] Implement better loading states
- [ ] Add more animations (framer-motion)
- [x] Improve accessibility
- [ ] Add more theme options

### Infrastructure

- [x] Migrate from Firebase to Vercel
- [x] Set up Neon DB for database
- [x] Configure deployment pipeline
- [x] Set up development environment
- [ ] Add staging environment
- [x] Add automated testing in pipeline
- [x] Add Docker support:
  - [x] Create Dockerfile for the application
  - [x] Set up Docker Compose for local development
  - [x] Add container orchestration configuration
  - [x] Document self-hosting instructions
- [x] Add deployment options:
  - [x] Vercel deployment
  - [x] Docker container deployment
  - [x] Custom server deployment guide

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- GitHub: [@AlexT](https://github.com/alexandru-tiron)
- Linkedin: [@AlexT](https://www.linkedin.com/in/alextiron)
