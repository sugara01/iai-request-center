# Fix SharePoint single-choice field payloads

## Goal
- Correct create and update behavior for the vehicle request SharePoint list so every single-choice value is stored reliably.

## Scope
- Analyze the generated SharePoint schema and operation definitions for `Departemen`, `Tujuan`, `CurrentStatus`, `AdminDecision`, and `PlantDirectorDecision`.
- Confirm each field is single-choice and determine the exact writable payload shape exposed by the connector: plain string, `{ Value: string }`, `{ Label: string }`, ID-backed property, or another generated structure.
- Update the shared TypeScript mapping used by vehicle request create and update operations to match the connector schema exactly.
- Normalize form values before submission, preserve blank optional decisions without invalid Choice objects, and ensure submitted labels match configured SharePoint options.
- Keep read normalization compatible with connector responses so Choice values display correctly whether returned as strings or objects.
- Remove or avoid metadata lookup calls that are not supported by the generated connector operation and can produce undefined `path` errors.

## User-facing behavior
- Vehicle request form: selected Department and Destination persist to SharePoint.
- New requests: Current Status persists as `Submitted`.
- Admin decision flow: Admin Decision and any resulting Current Status update persist together.
- Plant Director decision flow: Plant Director Decision and any resulting Current Status update persist together.
- Existing pages, routing, filters, and dashboard layout remain unchanged.

## Validation
- Verify representative create and update payloads against the generated operation types and schema.
- Validate the full project and SharePoint SDK usage.
- Confirm no Choice write path sends a conflicting label and ID representation in the same operation.
