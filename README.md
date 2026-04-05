# Solven API

Backend for [solven.uz](https://solven.uz) — a car marketplace platform with real-time notifications, agent profiles, community boards, and batch-powered rankings.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 10 + TypeScript |
| Database | MongoDB + Mongoose |
| API | GraphQL (Apollo Server) |
| Real-time | WebSockets (ws) |
| Auth | JWT (access + refresh token rotation) |
| Deploy | Docker + GitHub Actions CI/CD |

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB instance (local or Atlas)

### Setup

```bash
# Clone
git clone https://github.com/imurodl/solven.git
cd solven

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and secrets

# Run development servers
npm run start:dev          # API server (port 3007)
npm run start:dev:batch    # Batch server (port 3008)
```

### Docker

```bash
# Development
docker compose up -d

# Production
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

## Project Structure

NestJS monorepo with two applications:

- **solven-api** — Main GraphQL API with WebSocket support
- **solven-batch** — Scheduled jobs for car and agent ranking calculations

### Feature Modules

| Module | Description |
|--------|-------------|
| `member` | User management, profiles, authentication |
| `car` | Car listings, search, filtering |
| `board-article` | Community forum |
| `comment` | Comments on cars and articles |
| `like` | Favorites/likes with notification triggers |
| `follow` | Social following between members |
| `view` | Engagement tracking |
| `notification` | Real-time WebSocket notifications |
| `notice` | Admin announcements |
| `car-brand` | Brand/model catalog |

## API

GraphQL endpoint: `POST /graphql`

### Key Mutations

- `signup` / `login` — Returns access + refresh tokens
- `refreshToken` — Token rotation
- `createCar` / `updateCar` — Car CRUD (agent only)
- `likeTargetCar` / `likeTargetMember` — Toggle favorites
- `subscribe` / `unsubscribe` — Follow agents

### Key Queries

- `getCars` — Search with filters (location, type, price range, etc.)
- `getAgents` — Browse agents with sorting
- `getMember` — Profile with view tracking

## Deployment

Auto-deploys via GitHub Actions on push to `master`:

1. CI checks (build + lint)
2. SSH to VPS
3. Docker build + restart

Live at: [api.solven.uz](https://api.solven.uz)

## License

UNLICENSED
