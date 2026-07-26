# ADR 0002: Start with a modular monolith

- Status: Accepted
- Date: 26/07/2026

## Context

LumaForge must run reliably on a local network and a NAS without unnecessary operational complexity while maintaining clear domain boundaries.

## Decision

Use one Next.js application with explicit UI, application, domain, persistence, and import boundaries, backed by PostgreSQL. Use Docker Compose for deployment and do not introduce Kubernetes or microservices during bootstrap.

## Consequences

Deployment and local development remain approachable. Business logic must stay outside React components and route handlers so module boundaries remain enforceable.
