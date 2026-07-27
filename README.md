# LumaForge

> Know every component. Validate every connection. Build every display.

A self-hosted asset, inventory and configuration management platform for pixel displays, props, controllers, power systems and xLights deployments.

## Status

LumaForge has a working authenticated application foundation plus the first
operational product and asset workflows. Users can create revisioned product
definitions, allocate permanent identifiers to individually tracked physical
assets, search the catalogue and inventory, and inspect asset audit history.
Location, relationship, controller, electrical and xLights workflows remain
deferred to reviewed milestones.

The current product and asset milestone remains under review.

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
pnpm admin:create --email you@example.com
pnpm dev
```

The administrator command prompts for a password twice without echoing it. Open <http://localhost:3000> and sign in. PostgreSQL runs in Docker; Next.js runs directly on macOS for fast hot reload. Use placeholder development secrets only, and never point `DATABASE_URL` at production.

## Full-container development

For production-parity checks:

```bash
cp .env.example .env
docker compose up --build
```

This starts the application and PostgreSQL. It is not the default daily development loop.

## Environment variables

| Variable                  | Purpose                                                   |
| ------------------------- | --------------------------------------------------------- |
| `NODE_ENV`                | Runtime environment                                       |
| `TZ`                      | Runtime time zone; defaults to `Australia/Sydney`         |
| `APP_URL`                 | Canonical application URL                                 |
| `AUTH_SECRET`             | At least 32 random characters for authentication security |
| `POSTGRES_DB`             | PostgreSQL database name                                  |
| `POSTGRES_USER`           | PostgreSQL application user                               |
| `POSTGRES_PASSWORD`       | PostgreSQL password                                       |
| `DATABASE_URL`            | PostgreSQL connection URL                                 |
| `ATTACHMENT_STORAGE_PATH` | Persistent attachment directory                           |

`.env.example` contains placeholders only. Development, test, and production values must remain isolated.

## Database

```bash
pnpm db:generate  # generate a reviewed migration after a schema change
pnpm db:migrate   # apply committed migrations
pnpm db:seed      # deterministic development-only seed command
pnpm db:studio    # inspect a development database
pnpm admin:create # create the first local administrator
```

Application startup does not run migrations. Review [migration guidance](docs/development/database-migrations.md) before changing the schema.

## Local administrator authentication

LumaForge has no default account or password. After applying migrations, create the first administrator interactively:

```bash
pnpm admin:create --email you@example.com
```

For deliberate non-interactive automation, send the password over standard input rather than placing it in a command argument:

```bash
printf '%s\n' "$ADMIN_PASSWORD" | pnpm admin:create --email you@example.com --password-stdin
```

The command succeeds only when no user exists. Passwords use Argon2id, sessions are database-backed and revocable, cookies are HTTP-only and same-site, and repeated failed sign-ins are rate-limited. See [ADR 0003](docs/decisions/0003-authentication.md).

## Products and physical assets

Create a product definition under **Products**, then use **Assets** to create
one or more separately tracked physical items. Every item receives a permanent,
class-based identifier such as `PX-000184`.

Product changes append revisions; existing history is never rewritten. Asset
identifiers and classes are immutable, hard deletion is rejected, and physical
specification overrides require a reason. See
[ADR 0005](docs/decisions/0005-product-revisions-and-asset-identifiers.md).

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
