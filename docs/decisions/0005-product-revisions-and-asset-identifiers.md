# ADR 0005: Product revisions and permanent asset identifiers

## Status

Accepted.

## Context

Product catalogue information changes over time, while physical assets must
retain the product facts that applied when they were created. Human-readable
asset identifiers are operational identities and must remain unique under
concurrent creation, immutable after allocation and unavailable for reuse.

## Decision

- A product definition is a stable internal identity.
- Every catalogue change appends an immutable product revision.
- A physical asset may reference a specific product revision rather than a
  mutable current product record.
- Asset classes configure an uppercase identifier prefix and zero-padding.
- Each asset class owns a PostgreSQL counter row. Allocation atomically
  increments that row and returns the reserved range inside the asset-creation
  transaction.
- The permanent asset identifier and asset class are protected from update by
  a database trigger.
- Assets are retired rather than deleted. A database trigger rejects hard
  deletion.
- Known early product specifications are stored as structured JSON values.
  Decimal electrical and metric values remain decimal strings rather than
  binary floating-point values.
- Physical specification overrides require an explanation.

## Consequences

Concurrent requests cannot allocate the same identifier, and a rolled-back
creation cannot expose a partially created asset. Counter gaps are acceptable;
reusing an identifier is not.

Historical product revisions remain queryable and cannot be silently edited.
Future structured specification modules may add typed columns or validated
schemas while retaining the original revision payload.

Hard deletion is unavailable through the application or ordinary SQL. Test
cleanup uses isolated databases and table truncation only.
