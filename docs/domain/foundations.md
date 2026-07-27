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

Controller definitions and PSU definitions remain separate from physical
controller and PSU assets. A controller asset owns explicit outputs and power
banks. Output assignments store controller output, display element position,
prop number and string number independently. Logical identifiers are generated
from those fields and change on reassignment without changing permanent asset
IDs.

PSU voltage, current and power ratings use fixed-precision decimal values.
Power-bank allocations are effective-dated so a replacement supply does not
erase the previous topology.

## Relationships and configurations

Composition is not a nullable parent field. Typed relationships identify both assets, optional connectors or ports, sequence, effective dates, configuration revision, notes, and audit details. Assembly relationships must reject cycles.

Assignments belong to versioned configurations so draft, installed, active, and archived states can coexist without overwriting history.

## Locations and inventory

Locations form a hierarchy using stable codes such as `SHED-01`, `RACK-01`,
`SHELF-01` and `TOTE-01`. Friendly names and hierarchy paths are display
metadata; they are never encoded into permanent asset identifiers.

An asset movement closes its current effective-dated location assignment and
appends the next assignment in one transaction. Closed assignments are
immutable. An explicit unlocated assignment records removal from a known
location without erasing where the asset was previously stored.

Stocktakes are scoped to a location and its descendants. Scans retain both the
expected and observed location. Completion records unscanned expected assets
as missing, but it never changes asset location automatically.

Asset QR labels contain a portable relative scan route. Code 128 labels encode
the same permanent asset identifier for linear scanners.

## Validation

Validation belongs in a dedicated domain layer and produces information,
recommendation, warning, critical, or blocking results. Protocol, voltage, node,
output-current and PSU-capacity rules use structured facts and fixed-precision
decimal calculations. Missing capacity data is an informational result rather
than a silent pass.

Each run and result is immutable. Any permitted override appends its user,
reason and time without rewriting the finding. Compatible replacement PSUs are
reported when their voltage, current and power ratings satisfy an overloaded
bank.
