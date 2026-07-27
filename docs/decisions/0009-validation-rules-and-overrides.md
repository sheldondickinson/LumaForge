# ADR 0009: Deterministic validation rules and documented overrides

## Status

Accepted.

## Context

Controller output assignments and power allocations can be structurally valid
while still describing an unsafe or unsupported installation. Validation must
be repeatable, explain its calculations, and distinguish missing catalogue data
from a passing configuration.

## Decision

- Validation runs are immutable snapshots of the current controller, output,
  component, product and PSU facts.
- Pure domain rules evaluate protocol support, output node and current limits,
  mixed bank voltages, PSU voltage, and PSU current and power capacity.
- Electrical comparisons use fixed-precision decimal scaling rather than
  binary floating-point arithmetic.
- Every result records a stable rule code, severity, scope, plain-language
  message and structured evidence.
- Missing capacity data produces an informational result; it is never treated
  as a silent pass.
- Compatible replacement PSUs are included in overload evidence when their
  voltage, current and power ratings satisfy the calculated requirement.
- Permitted overrides append the responsible user, reason and timestamp to a
  result. The original result remains unchanged and override reasons are
  mandatory.

## Consequences

Users can rerun validation after configuration changes, inspect the exact
reason for each finding, and retain an audit trail when accepting a known risk.
Adding a new rule requires a stable code, severity, evidence contract and
calculation tests.
