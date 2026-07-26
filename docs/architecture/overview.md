# Architecture overview

## Shape

LumaForge begins as a modular monolith. A single Next.js deployment contains the web interface, application services, domain modules, import adapters, and persistence adapters. PostgreSQL is the system of record; attachment data uses a separate persistent storage path.

This keeps local-network deployment understandable while preserving boundaries that can be tested independently:

```text
UI and route boundaries
        ↓
application services
        ↓
domain rules
        ↓
persistence and external import adapters
```

React components render state and collect input. They do not calculate electrical values, allocate identifiers, decide compatibility, or revise historical relationships.

## Data principles

- Database UUIDs are internal identities.
- Permanent human-readable asset IDs are immutable operational identities.
- Current logical assignments are structured, regenerated labels rather than asset identity.
- Product definitions and their revisions are separate from physical assets.
- Relationships are typed, effective-dated, and revision-aware.
- Electrical values use decimal-safe database and application representations.
- Material changes append audit events.

## Environment boundaries

Development, test, and production use PostgreSQL 17 and the same migration files, application code, environment-variable names, storage abstraction, and validation rules. They do not share databases, credentials, session secrets, attachment directories, backups, or generated data.

## xLights boundary

xLights remains authoritative for layout, model geometry, sequencing, effects, model groups, and applicable controller uploads. LumaForge is authoritative for physical inventory, lifecycle, physical wiring, power allocation, procurement, and maintenance. Imports are retained as versioned external snapshots and never write back during the MVP.
