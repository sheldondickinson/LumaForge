# ADR 0007: Effective-dated assemblies and explicit component positions

## Status

Accepted.

## Context

Display props are assembled from independently tracked physical assets. A
singing face may have five strings, but those strings have distinct physical
roles and can be replaced independently. A single parent column or mutable list
would lose replacement history and cannot safely represent other relationship
types.

## Decision

- A display element is attached one-to-one to an existing physical prop asset.
- Required component positions are explicit ordered records with stable codes
  such as `P01`.
- Asset relationships record a type, source and target assets, optional
  position and connectors, configuration revision, effective dates, notes and
  actor.
- Assigning a replacement closes the current position relationship and inserts
  a new revision in one transaction.
- `contains` and `component_of` relationships form the assembly graph.
  PostgreSQL rejects any active relationship that would introduce a cycle.
- Closed relationships, display elements and component positions cannot be
  hard-deleted.

## Consequences

Assembly history remains queryable without reconstructing overwritten state.
The model supports positions with distinct names and later connector metadata.
More complete draft, installed, active and archived configuration workflows
remain a separate milestone.
