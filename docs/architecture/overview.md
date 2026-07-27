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

## Authentication boundary

Local users, revocable sessions, login rate limits, and audit events live in PostgreSQL. The first administrator is created through an explicit CLI command; there are no default credentials or unauthenticated administration endpoints. Server layouts perform authoritative session validation before rendering the application shell.

## Data principles

- Database UUIDs are internal identities.
- Permanent human-readable asset IDs are immutable operational identities.
- Current logical assignments are structured, regenerated labels rather than asset identity.
- Product definitions and their revisions are separate from physical assets.
- Relationships are typed, effective-dated, and revision-aware.
- Electrical values use decimal-safe database and application representations.
- Material changes append audit events.

## Product and asset boundary

Product definitions are stable catalogue identities. Product revisions are
append-only facts, and physical assets point to the exact revision used for
their catalogue basis. Asset-specific differences are stored as explained
overrides rather than rewriting the product.

Permanent asset identifiers are allocated inside PostgreSQL transactions by a
per-class counter. Database constraints and triggers protect revision history,
asset identity, class consistency and retirement-only lifecycle handling.

## Location and stocktake boundary

Location hierarchy, effective-dated asset assignments and stocktake results
are retained in PostgreSQL. The open assignment represents current location;
closed assignments are immutable history. PostgreSQL prevents hierarchy cycles
and hard deletion of location or inventory history.

Stocktakes compare scans with the assignment state for a selected location
subtree. They report missing, moved and unexpected assets without silently
changing an asset's recorded location.

QR and Code 128 labels are generated inside the application. QR payloads use a
relative authenticated scan route so stored label data is not coupled to a
development or production hostname.

## Relationship and assembly boundary

Display elements attach assembly metadata to physical prop assets. Ordered,
named component positions describe the required physical roles. Effective-dated
asset relationships retain replacements as configuration revisions rather than
overwriting the active assignment. PostgreSQL protects closed history and
rejects cycles in the active assembly graph.

## Controller and power boundary

Controller and PSU definitions describe reusable capabilities while specialised
records connect them to permanent physical assets. Outputs, power banks, output
assignments and PSU allocations are structured records. Logical deployment
identifiers are derived from controller code, output number, prop number and
string number; they are not asset identity. Reassignments close previous
effective-dated rows and retain deployment history.

## Environment boundaries

Development, test, and production use PostgreSQL 17 and the same migration files, application code, environment-variable names, storage abstraction, and validation rules. They do not share databases, credentials, session secrets, attachment directories, backups, or generated data.

## xLights boundary

xLights remains authoritative for layout, model geometry, sequencing, effects, model groups, and applicable controller uploads. LumaForge is authoritative for physical inventory, lifecycle, physical wiring, power allocation, procurement, and maintenance. Imports are retained as versioned external snapshots and never write back during the MVP.
