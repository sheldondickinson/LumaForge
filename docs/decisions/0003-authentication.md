# ADR 0003: Local authentication direction

- Status: Proposed
- Date: 26/07/2026

## Context

The first self-hosted release requires secure local administrator authentication without an external identity provider and must preserve a path to Administrator, Editor, and Viewer roles.

## Decision

Implement database-backed local accounts and server-managed sessions in the next reviewed milestone. Passwords will use a strong memory-hard hashing function, cookies will be secure, HTTP-only, same-site, and rotated, and administrator creation will use a first-run or explicit CLI bootstrap flow. No default credential will exist.

## Consequences

The bootstrap shell is not an administrative product surface and does not expose mutation endpoints. Authentication is deliberately not approximated with insecure placeholder logic.
