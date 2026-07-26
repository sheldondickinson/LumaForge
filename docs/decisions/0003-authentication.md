# ADR 0003: Local authentication direction

- Status: Accepted
- Date: 26/07/2026

## Context

The first self-hosted release requires secure local administrator authentication without an external identity provider and must preserve a path to Administrator, Editor, and Viewer roles.

## Decision

Use database-backed local accounts and opaque, server-managed sessions. Passwords use Argon2id with 64 MiB memory, three passes, and a 32-byte output. Only a SHA-256 hash of each random 256-bit session token is stored.

Administrator creation uses an explicit CLI flow protected by a PostgreSQL transaction-level advisory lock. The command succeeds only while the user table is empty and never accepts a password as a command-line argument. No default credential exists.

Session cookies are HTTP-only, same-site strict, path-scoped to `/`, and secure in production. Sessions expire after 12 hours and can be revoked. Application layouts perform the authoritative database session check; the Next.js proxy only provides an early cookie-presence redirect.

Failed sign-ins are rate-limited by an HMAC-derived email identifier in PostgreSQL. Sign-in, sign-out, failed authentication, and administrator bootstrap actions create audit events.

## Consequences

This remains a local authentication system and does not require an external identity provider. Administrator, Editor, and Viewer roles exist in the schema, although only Administrator creation is exposed in this milestone.

Session rotation, password change/recovery, multi-user administration, role assignment, and periodic expired-session cleanup remain future reviewed work. Production requires TLS at the reverse proxy or application boundary for secure cookies.
