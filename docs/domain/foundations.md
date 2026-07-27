# Domain foundations

## Assets and products

Every independently tracked physical component is an asset. A product
definition describes shared catalogue specifications; an asset represents
physical reality and may record explained overrides. Product edits create
revisions and do not rewrite historical facts.

The initial product catalogue records a stable product definition and
append-only revisions containing the friendly name, manufacturer, model,
description and structured specifications. Physical assets reference the exact
revision that applied when they were created.

Asset classes configure the identifier prefix and padding. The initial
installation seeds pixel strings, props, controllers, power supplies,
enclosures, cables, power distribution, receivers, network devices, DMX
fixtures, structural components, sensors and projectors.

## Permanent and logical identifiers

Permanent identifiers such as `PX-000184` never contain location or deployment
state, never change, and are never reused. Logical assignment labels such as
`A-O03-P022-S02` are generated from structured controller, output, element, and
position fields. They change when an assignment changes.

PostgreSQL allocates identifier ranges by atomically advancing one counter per
asset class. Batch creation produces one asset record and one audit event for
each separately trackable physical item. Counter gaps are acceptable; reuse is
not.

User-facing controller outputs use `O` (`O01`, `O02`, and so on). `P` remains reserved for general props.

## Relationships and configurations

Composition is not a nullable parent field. Typed relationships identify both assets, optional connectors or ports, sequence, effective dates, configuration revision, notes, and audit details. Assembly relationships must reject cycles.

Assignments belong to versioned configurations so draft, installed, active, and archived states can coexist without overwriting history.

## Validation

Validation belongs in a dedicated domain layer and produces information, recommendation, warning, critical, or blocking results. Any permitted override records its rule, severity, user, reason, time, and configuration revision. Blocking overrides require a documented reason.
