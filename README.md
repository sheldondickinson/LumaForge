# LumaForge

> Know every component. Validate every connection. Build every display.

A self-hosted asset, inventory and configuration management platform for pixel displays, props, controllers, power systems and xLights deployments.

## Status

LumaForge is at the repository bootstrap milestone. This foundation provides a responsive Next.js shell, PostgreSQL and Drizzle migration plumbing, health endpoints, Docker definitions, automated checks, and deployment documentation. Asset-management and authentication workflows are deliberately deferred to reviewed milestones.

Screenshots will be added when the first operational module is ready for review.

## Architecture

LumaForge is a modular monolith designed to run entirely on a local network:

- Next.js App Router provides the web interface and application boundary.
- Domain rules live under `lib/domain/` and remain independent of React and controller manufacturers.
- Zod validates boundary input.
- Drizzle maps application data to PostgreSQL using reviewed migrations.
- xLights files will be imported as immutable, versioned external snapshots.
- Docker Compose packages production without requiring Kubernetes or a cloud service.

See the [architecture overview](docs/architecture/overview.md) and [decision records](docs/decisions/).

## Technology

- Next.js, React, strict TypeScript, Tailwind CSS, and shadcn/ui conventions
- Zod, Drizzle ORM, and PostgreSQL 17
- Vitest, React Testing Library, and Playwright
- pnpm, ESLint, Prettier, Docker Compose, and GitHub Actions

## Local macOS development

Requirements: Node.js 22 or later, pnpm 11 or later, and Docker Desktop with Compose.

```bash
cp .env.example .env
docker compose up -d postgres
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open <http://localhost:3000>. PostgreSQL runs in Docker; Next.js runs directly on macOS for fast hot reload. Use placeholder development secrets only, and never point `DATABASE_URL` at production.

## Full-container development

For production-parity checks:

```bash
cp .env.example .env
docker compose up --build
```

This starts the application and PostgreSQL. It is not the default daily development loop.

## Environment variables

| Variable                  | Purpose                                               |
| ------------------------- | ----------------------------------------------------- |
| `NODE_ENV`                | Runtime environment                                   |
| `TZ`                      | Runtime time zone; defaults to `Australia/Sydney`     |
| `APP_URL`                 | Canonical application URL                             |
| `AUTH_SECRET`             | Long random value reserved for secure session signing |
| `POSTGRES_DB`             | PostgreSQL database name                              |
| `POSTGRES_USER`           | PostgreSQL application user                           |
| `POSTGRES_PASSWORD`       | PostgreSQL password                                   |
| `DATABASE_URL`            | PostgreSQL connection URL                             |
| `ATTACHMENT_STORAGE_PATH` | Persistent attachment directory                       |

`.env.example` contains placeholders only. Development, test, and production values must remain isolated.

## Database

```bash
pnpm db:generate  # generate a reviewed migration after a schema change
pnpm db:migrate   # apply committed migrations
pnpm db:seed      # deterministic development-only seed command
pnpm db:studio    # inspect a development database
```

Application startup does not run migrations. Review [migration guidance](docs/development/database-migrations.md) before changing the schema.

## Quality checks

```bash
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm build
```

The integration suite requires an isolated PostgreSQL test database. Playwright requires its Chromium browser package.

## Docker commands

```bash
pnpm docker:up
pnpm docker:down
pnpm docker:logs
```

Before a NAS release, validate the production definition locally with local-only values:

```bash
docker compose -f compose.production.yaml up --build
```

## Production deployment

Production is intended to run through a manually dispatched GitHub Actions workflow on a labelled self-hosted NAS runner. It builds the image on the runner, takes a pre-migration backup, applies migrations explicitly, deploys with Docker Compose, and waits for health checks.

No NAS deployment has been performed or implied by this repository bootstrap. See:

- [NAS deployment architecture](docs/deployment/nas.md)
- [backup and restore](docs/deployment/backup-and-restore.md)
- [unresolved NAS information](docs/deployment/nas-prerequisites.md)

## Contribution workflow

Create a feature branch, make small reviewable commits, run all available checks, push the branch, and open a pull request to `main`. Do not push directly to `main`. Explain assumptions, migrations, security impact, and any check that could not run.

Read [AGENTS.md](AGENTS.md), the [development guide](docs/development/getting-started.md), and relevant architecture documents before consequential changes.

## Security

Report vulnerabilities using the private channel designated by the repository owner. Until that channel is published, do not disclose suspected vulnerabilities in a public issue. See [SECURITY.md](SECURITY.md).

## Roadmap

The staged delivery plan is documented in [the roadmap](docs/development/roadmap.md).

## Licence

Licence: All rights reserved until a licence is selected.

No open-source licence has been granted. See [ADR 0001](docs/decisions/0001-licensing.md).
