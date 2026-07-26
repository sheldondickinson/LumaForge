# LumaForge Codex Operating Guide

This file is the durable operating guide for all Codex work in this repository.

## Before changing the system

- Read this file, `README.md`, and the relevant files under `docs/` before making architectural changes.
- Record consequential decisions as Architecture Decision Records under `docs/decisions/`.
- Explain material assumptions in pull request descriptions.
- Preserve backwards compatibility unless a breaking migration is deliberately documented.

## Language, units, and data

- Use Australian English in documentation and user-facing copy.
- Use metric units.
- Display dates in Australian format while storing timestamps consistently.
- Use decimal-safe calculations for electrical values; do not persist precision-sensitive electrical calculations using ordinary binary floating-point arithmetic.
- Never silently weaken validation rules.

## Domain integrity

- A permanent asset identifier never changes and is never reused.
- Keep current deployment assignments separate from permanent asset identity.
- Never overwrite historical assignments.
- Use typed, effective-dated relationships and configuration revisions.
- Keep domain logic independent of specific controller manufacturers.
- Keep business logic out of React components and route handlers.
- Treat xLights data as imported, versioned external snapshots.
- Never modify active xLights files automatically.
- Avoid unnecessary microservices and cloud dependencies in the core application.
- Design the system to operate entirely on a local network.

## Database and testing

- Create a database migration for every schema change.
- Add or update automated tests for each material business rule.
- Use the same migration files and validation rules in development, test, and production.
- Never connect local development automatically to the production database.
- Never deploy destructive database or infrastructure changes automatically.
- Run formatting, linting, type checking, and tests before completing a task.
- Report every check that could not be run.

## Security

- Never commit passwords, tokens, private keys, SSH keys, `.env` files, or NAS credentials.
- Do not place secrets in client bundles or logs.
- Keep development, test, and production credentials, databases, session secrets, attachments, backups, and generated data isolated.

## Delivery and deployment

- Use small, reviewable commits.
- Do not push directly to `main`.
- Keep deployment configuration reproducible.
- Do not deploy every branch, commit, or pull request.
- The MacBook is the normal development environment; the NAS is a deliberate staging and production target.
- Never claim a NAS deployment succeeded unless it was actually performed and verified.
- Never perform a destructive production or NAS action without explicit approval.
