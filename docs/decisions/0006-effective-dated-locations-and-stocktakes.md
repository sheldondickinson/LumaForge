# ADR 0006: Effective-dated locations and stocktakes

## Status

Accepted.

## Context

Assets move between sheds, racks, shelves, totes, installations and temporary
work areas. The current location must be easy to query without overwriting
where an asset was previously recorded. Location labels and asset labels may
remain physically attached for years, so their identifiers must not depend on
a hostname or mutable hierarchy path.

Stocktakes need to compare observed assets with the location records that
existed when the count was performed and retain missing or unexpected results.

## Decision

- Locations form a self-referencing hierarchy with a permanent, globally
  unique uppercase code and a mutable friendly name.
- PostgreSQL rejects self-parenting and ancestor cycles.
- Asset location is represented by effective-dated assignment rows. A move
  closes the active row and appends a new row in one transaction.
- Closed location assignments are immutable and location or inventory history
  cannot be hard-deleted.
- A stocktake is scoped to one location and all of its descendants.
- Scans record the expected and observed locations. Completing a stocktake
  appends missing entries for expected assets that were not scanned.
- Stocktakes report discrepancies; they do not silently move assets.
- QR labels contain a stable relative route such as
  `/scan/assets/PX-000184`. Code 128 encodes the permanent asset identifier.
- QR and Code 128 images are generated locally by the server without a cloud
  service.

## Consequences

Current location remains queryable through the single open assignment while
movement history is preserved. Location codes cannot be recycled or rewritten
after labels have been printed.

A stocktake does not change inventory truth by itself. A user must record an
explicit, separately audited asset movement to reconcile a discrepancy.

Relative QR routes remain portable between local development, future NAS
hostnames and reverse-proxy configurations. A scanned route still requires a
valid LumaForge session.
