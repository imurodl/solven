# Solven API

Car marketplace backend with real-time features — car listings, agent profiles, community boards, notifications, and batch ranking.

## Tech Stack

- **Framework**: NestJS 10 + TypeScript 5.1
- **Database**: MongoDB 8 + Mongoose ODM
- **API**: GraphQL (Apollo Server) + WebSockets (ws)
- **Auth**: JWT (1h access + 30d refresh token rotation), bcryptjs
- **Monorepo**: 2 apps — `solven-api` (main API, port 3007) and `solven-batch` (cron jobs, port 3008)
- **Deploy**: Docker on VPS, CI/CD via GitHub Actions, Nginx reverse proxy

## Architecture

```
apps/
├── solven-api/src/
│   ├── components/        # Feature modules (NestJS module pattern)
│   │   ├── member/        # Users, agents, admin — signup/login/profile
│   │   ├── car/           # Car CRUD, search, filtering, stats
│   │   ├── board-article/ # Community posts
│   │   ├── comment/       # Comments on cars/articles
│   │   ├── like/          # Favorites system with notifications
│   │   ├── view/          # View tracking (cars, members, articles)
│   │   ├── follow/        # Social following
│   │   ├── notification/  # Real-time notification delivery
│   │   ├── notice/        # Admin announcements
│   │   ├── car-brand/     # Brand/model catalog
│   │   └── auth/          # JWT service, guards (Auth/Roles/Without)
│   ├── database/          # MongoDB connection setup
│   ├── schemas/           # Mongoose models
│   ├── libs/              # Shared: config, DTOs, enums, types, interceptor
│   └── socket/            # WebSocket gateway for real-time notifications
│
└── solven-batch/src/      # Scheduled batch jobs
    └── batch.service.ts   # Monthly ranking: batchTopCars, batchTopAgents
```

## Key Conventions

- Each feature module has: `*.module.ts`, `*.resolver.ts` (GraphQL), `*.service.ts` (business logic)
- Guards: `AuthGuard` (required auth), `RolesGuard` (role-based), `WithoutGuard` (optional auth)
- Use NestJS `Logger` (not console.log) — `private readonly logger = new Logger(ClassName.name)`
- DTOs use `class-validator` decorators for input validation
- GraphQL schema is code-first (decorators on TypeScript classes)
- MongoDB aggregation pipelines for complex queries (lookups in `libs/config.ts`)
- File uploads go to `./uploads/` directory, served as static files

## Auth Flow

- Access token: 1h expiry, contains full member profile (minus password)
- Refresh token: 30d expiry, minimal payload (_id + memberType), stored as bcrypt hash in DB
- Token rotation: each refresh invalidates the old token and issues new pair
- Mutations: `login`, `signup`, `refreshToken`, `logout`

## Commands

```bash
npm run start:dev          # API dev server (watch mode)
npm run start:dev:batch    # Batch dev server (watch mode)
npm run build              # Build both apps
npm run start:prod         # Production API
npm run start:prod:batch   # Production batch
npm run lint               # ESLint (flat config)
```

## Docker

```bash
docker compose up -d                              # Dev (volume mount, rebuilds in container)
docker compose -f docker-compose.prod.yml build   # Prod build (Dockerfile, layer cached)
docker compose -f docker-compose.prod.yml up -d   # Prod run
```

## Environment Variables

See `.env.example` for all required variables. Key ones:
- `SECRET_TOKEN` — JWT signing secret
- `REFRESH_SECRET` — Refresh token secret (falls back to SECRET_TOKEN + '_refresh')
- `MONGO_PROD` / `MONGO_DEV` — MongoDB connection URIs

## Deployment

- **VPS**: Docker containers behind Nginx with SSL (Certbot)
- **CI/CD**: GitHub Actions on push to `master` — build check + lint, then SSH deploy with retry
- **Domain**: `api.solven.uz` (API), `solven.uz/api/` (proxied), `solven.uz/ws/` (WebSocket)
