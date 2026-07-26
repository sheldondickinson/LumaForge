# Database migrations

Every schema change requires a committed migration.

1. Change the Drizzle schema.
2. Run `pnpm db:generate`.
3. Review the generated SQL and test it against an isolated database.
4. Document backwards-compatibility and rollback implications in the pull request.
5. Apply it with `pnpm db:migrate`.

Application startup never applies migrations. Production takes a pre-migration backup and runs migrations as a distinct deployment step.

Rollback is migration-specific. Prefer a forward corrective migration once production data exists. A destructive reversal requires explicit approval, a verified backup, and documented data consequences.
