# Security Policy

## Supported versions

LumaForge is pre-release software. Security updates currently target the latest code on `main`.

## Reporting a vulnerability

Do not report a suspected vulnerability in a public GitHub issue.

The repository owner must nominate a private reporting channel before the first public release. Until then, contact the repository owner privately through an existing trusted channel and avoid including credentials, production data, or exploit details in shared logs.

## Baseline

- Secrets and production `.env` files stay outside the repository.
- Administrative endpoints must require authentication before they are introduced.
- Input is validated at application boundaries.
- Containers run without root privileges.
- PostgreSQL is not exposed publicly in production.
- Migrations and destructive infrastructure operations require deliberate execution.
- Privileged material changes produce audit events.
