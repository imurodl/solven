# AI Agent Guide — Solven API

This file helps AI coding agents understand the project quickly.

## What is this?

A NestJS GraphQL backend for a car marketplace. Two apps in a monorepo:
- `solven-api` — Main API (GraphQL, WebSocket, port 3007)
- `solven-batch` — Cron jobs for ranking calculations (port 3008)

## Quick orientation

| What | Where |
|------|-------|
| Entry point | `apps/solven-api/src/main.ts` |
| Root module | `apps/solven-api/src/app.module.ts` |
| Feature modules | `apps/solven-api/src/components/{feature}/` |
| Mongoose schemas | `apps/solven-api/src/schemas/` |
| GraphQL DTOs | `apps/solven-api/src/libs/dto/` |
| Enums | `apps/solven-api/src/libs/enums/` |
| Shared helpers | `apps/solven-api/src/libs/config.ts` |
| Auth guards | `apps/solven-api/src/components/auth/guards/` |
| Batch jobs | `apps/solven-batch/src/batch.service.ts` |
| Env vars | `.env` (see `.env.example`) |

## Module pattern

Every feature follows `module → resolver → service`:

```
components/car/
├── car.module.ts      # Declares dependencies
├── car.resolver.ts    # GraphQL endpoints (thin layer, delegates to service)
└── car.service.ts     # Business logic and database operations
```

Resolvers handle auth guards and input parsing. Services handle business logic and DB queries.

## Key patterns to follow

- **Logging**: Use `private readonly logger = new Logger(ClassName.name)` from `@nestjs/common`. Never use `console.log`.
- **Auth**: Three guard types — `AuthGuard` (required), `RolesGuard` (role-based), `WithoutGuard` (optional). Access user via `@AuthMember('_id')`.
- **GraphQL**: Code-first schema. Add `@Field()` decorators to DTO classes, `@Mutation()`/`@Query()` to resolvers.
- **Validation**: Use `class-validator` decorators on input DTOs.
- **ObjectIds**: Use `shapeIntoMongoObjectId()` from `libs/config.ts` to convert strings.
- **Aggregations**: Check `libs/config.ts` for existing MongoDB lookup helpers before writing new pipelines.

## Auth flow

- Access token: 1h, contains member profile, signed with `SECRET_TOKEN`
- Refresh token: 30d, minimal payload, signed with `REFRESH_SECRET`
- Tokens are rotated on refresh — old refresh token is invalidated

## Build and verify

```bash
npm install                    # Install deps
npx nest build solven-api      # Build API
npx nest build solven-batch    # Build batch
npm run lint                   # Lint check
npm run start:dev              # Dev server with watch
```

## Things to avoid

- Adding fields to resolvers without also adding them to the DTO (`libs/dto/`) and schema (`schemas/`)
- Using raw `console.log` instead of NestJS Logger
- Bypassing auth guards without explicit reason
- Hardcoding environment-specific values
