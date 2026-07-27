# ADR 0008: Structured controller and power assignments

## Status

Accepted.

## Context

Controller ports and power supplies are physical inventory, while their
deployment assignments change between configurations. A label such as
`A-O03-P022-S02` is operationally useful but must not become an asset identity
or an opaque persisted string.

## Decision

- Controller and PSU definitions are separate from their physical asset
  specialisations.
- A controller asset has an immutable short deployment code, explicit outputs
  and explicit power banks.
- Output assignments store controller output, display element position, prop
  number and string number as separate fields.
- Logical identifiers are generated from those structured fields and are not
  persisted as permanent identity.
- Reassigning a display element position closes its current output assignment
  and appends a new one.
- PSU electrical ratings use fixed-precision decimal database values.
- PSU-to-bank allocations are effective-dated and preserve replacement history.
- Voltage, protocol and capacity compatibility are evaluated by the following
  validation milestone rather than silently enforced here.

## Consequences

Logical labels regenerate when deployment assignments move, while permanent
controller, prop, string and PSU asset identifiers remain unchanged. Historical
output and power topology stays queryable.
