# Development guide

The MacBook is the primary development environment. Run Next.js directly on macOS and PostgreSQL in Docker for normal work.

1. Install Node.js 22 or later, pnpm 11 or later, and Docker Desktop.
2. Copy `.env.example` to `.env` and replace placeholders with development-only values.
3. Run `docker compose up -d postgres`.
4. Run `pnpm install --frozen-lockfile`.
5. Run `pnpm db:migrate` and `pnpm db:seed`.
6. Run `pnpm admin:create --email you@example.com` and enter a development-only password.
7. Run `pnpm dev`.
8. Open <http://localhost:3000> and sign in.

Use `docker compose up --build` only when validating the container boundary and networking. Never use the NAS as the ordinary development server.

## Command catalogue

- `pnpm dev`: start the local Next.js development server.
- `pnpm build`: create the production application build.
- `pnpm start`: run a completed production build.
- `pnpm lint`: run ESLint.
- `pnpm format`: format supported files with Prettier.
- `pnpm format:check`: verify formatting without editing files.
- `pnpm typecheck`: run strict TypeScript checking.
- `pnpm test`: run the Vitest suite.
- `pnpm test:unit`: run unit and component tests.
- `pnpm test:integration`: run database integration tests.
- `pnpm test:e2e`: run Playwright browser tests.
- `pnpm db:generate`: generate a Drizzle migration.
- `pnpm db:migrate`: apply committed migrations.
- `pnpm db:seed`: load deterministic development data.
- `pnpm db:studio`: open Drizzle Studio against a deliberate non-production database.
- `pnpm admin:create --email <address>`: interactively create the first local administrator after migrations.
- `pnpm docker:up`: start local PostgreSQL.
- `pnpm docker:down`: stop the local Compose stack.
- `pnpm docker:logs`: follow local Compose logs.
