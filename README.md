# LumaForge

> Know every component. Validate every connection. Build every display.

A self-hosted asset, inventory and configuration management platform for pixel displays, props, controllers, power systems and xLights deployments.

## Status

LumaForge has a working authenticated application foundation plus operational
product, asset, inventory, assembly, controller, power and validation workflows.
Users can create revisioned product definitions, allocate permanent identifiers
to individually tracked physical assets, organise hierarchical storage
locations, retain asset movement history, run location stocktakes, print local
QR and Code 128 labels, define display elements with named component positions,
retain component replacement history, configure controller outputs and power
banks, allocate physical power supplies, generate structured logical deployment
identifiers, and run documented electrical and compatibility checks. xLights
workflows remain deferred to a reviewed milestone.

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

## Locations, movements and stocktakes

Create stable shed, rack, shelf and tote codes under **Locations**. Move an
asset from its detail screen; the previous effective-dated assignment remains
visible and immutable.

Stocktakes include the selected location and its descendants. Scans record
confirmed and discrepant assets, and completion records unscanned expected
assets as missing without moving anything automatically.

Each asset has a printable QR and Code 128 label. QR codes use a relative
authenticated route such as `/scan/assets/PX-000184`, keeping labels portable
between local and future NAS hostnames. See
[ADR 0006](docs/decisions/0006-effective-dated-locations-and-stocktakes.md).

## Relationships and assemblies

Create a display element from an existing physical prop asset, then define each
component position explicitly. Assignments are typed and effective-dated.
Replacing a physical component closes the previous assignment and creates the
next configuration revision without rewriting history.

General contains, mounted-on and connected-to relationships can be added from
asset details. PostgreSQL rejects circular active assemblies. See
[ADR 0007](docs/decisions/0007-effective-dated-assemblies.md).

## Controllers and power

Specialise physical controller assets with a stable controller code, explicit
outputs and power banks. Assign display-element positions to outputs using
separate prop and string numbers. LumaForge generates labels such as
`A-O03-P022-S02`; reassignment changes that logical label without changing any
permanent asset identifier.

Physical PSU assets use decimal-safe voltage, current and power ratings and can
be allocated to controller power banks with effective-dated history. See
[ADR 0008](docs/decisions/0008-controller-power-assignments.md).

## Validation and overrides

Run validation from a controller detail screen to check supported pixel
protocols, mixed voltages, output node and current limits, and PSU voltage and
capacity. Every finding records its severity and calculation evidence. Missing
capacity data is reported explicitly, and permitted overrides require a reason
and retain the responsible user and time.

Overloaded banks include compatible replacement PSU identifiers when available.
See [ADR 0009](docs/decisions/0009-validation-rules-and-overrides.md).

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
