# Domain foundations

## Assets and products

Every independently tracked physical component is an asset. A product definition describes shared catalogue specifications; an asset represents physical reality and may record explained overrides. Product edits create revisions and do not rewrite historical facts.

## Permanent and logical identifiers

Permanent identifiers such as `PX-000184` never contain location or deployment state, never change, and are never reused. Logical assignment labels such as `A-O03-P022-S02` are generated from structured controller, output, element, and position fields. They change when an assignment changes.

User-facing controller outputs use `O` (`O01`, `O02`, and so on). `P` remains reserved for general props.

## Relationships and configurations

Composition is not a nullable parent field. Typed relationships identify both assets, optional connectors or ports, sequence, effective dates, configuration revision, notes, and audit details. Assembly relationships must reject cycles.

Assignments belong to versioned configurations so draft, installed, active, and archived states can coexist without overwriting history.

## Validation

Validation belongs in a dedicated domain layer and produces information, recommendation, warning, critical, or blocking results. Any permitted override records its rule, severity, user, reason, time, and configuration revision. Blocking overrides require a documented reason.
