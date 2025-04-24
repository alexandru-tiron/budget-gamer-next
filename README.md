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

- **Frontend**: Migrated from vanilla JS/HTML/CSS to Next.js 14 with App Router
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

- Node.js 18+
- pnpm (recommended) or npm
- A Neon DB account
- A Vercel account (for deployment)

### Local Development

1. Clone the repository

```bash
git clone https://github.com/alexandru-tiron/budget-gamer-next.git
cd budget-gamer-next
```

2. Install dependencies

```bash
pnpm install
```

3. Set up environment variables

```bash
cp .env.example .env
```

Fill in your environment variables in the .env file.

4. Set up the database

```bash
pnpm db:push
```

5. Run the development server

```bash
pnpm dev
```

The app should now be running at http://localhost:3000

### Database Management

- Generate migrations: `pnpm db:generate`
- Push schema changes: `pnpm db:push`
- View database: `pnpm db:studio`

## Deployment

The easiest way to deploy Budget Gamer is using Vercel:

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your environment variables
4. Deploy!

## TODO List

### Performance Improvements

- [x] Implement server-side rendering
- [x] Add route pre-fetching
- [x] Add loading states and skeletons
- [ ] Optimize bundle size
- [ ] Add service worker for offline support

### Features

- [x] Add game store parsers:
  - [x] Steam Store
  - [x] Epic Games Store
  - [x] PlayStation Store (PS Plus)
  - [ ] Xbox Store
  - [ ] Nintendo eShop
  - [x] GOG
  - [ ] Origin
- [x] Add subscription-based game tracking:
  - [x] PlayStation Plus
  - [x] Amazon Prime
  - [x] Humble Bundle
  - [ ] Nintendo Online
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
- [ ] Implement error handling
- [ ] Add logging system
- [ ] Set up monitoring and analytics
- [ ] Add end-to-end testing
- [ ] Improve TypeScript strictness
- [ ] Add API documentation

### UI/UX

- [x] Implement modern UI design
- [x] Add side panel navigation
- [x] Create game card components
- [x] Add social sharing functionality
- [ ] Improve navigation
- [ ] Add more interactive elements
- [ ] Implement better loading states
- [ ] Add more animations (framer-motion)
- [ ] Improve accessibility
- [ ] Add more theme options

### Infrastructure

- [x] Migrate from Firebase to Vercel
- [x] Set up Neon DB for database
- [x] Configure deployment pipeline
- [x] Set up development environment
- [ ] Add staging environment
- [ ] Add automated testing in pipeline
- [ ] Add Docker support:
  - [ ] Create Dockerfile for the application
  - [ ] Set up Docker Compose for local development
  - [ ] Add container orchestration configuration
  - [ ] Document self-hosting instructions
- [ ] Add deployment options:
  - [x] Vercel deployment
  - [ ] Docker container deployment
  - [ ] Custom server deployment guide

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- GitHub: [@AlexT](https://github.com/alexandru-tiron)
- Linkedin: [@AlexT](https://www.linkedin.com/in/alextiron)
