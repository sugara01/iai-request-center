# Fix all RequestKendaraan Choice mappings

## Scope
- Keep the existing `/request-kendaraan` form, navigation, visual layout, SharePoint list, and Power Automate ownership unchanged.
- Correct the TypeScript boundary between form/domain values and the SharePoint `RequestKendaraan` connector for both create and update operations.

## Schema findings
- `Departemen` — single-choice.
- `Tujuan` — single-choice.
- `CurrentStatus` — single-choice.
- `AdminDecision` — single-choice.
- `PlantDirectorDecision` — single-choice.
- No multi-choice columns are present in the current `RequestKendaraan` schema.

## Changes
- Add one typed Choice mapping layer that converts each domain key to its exact SharePoint label, resolves the connector metadata ID, and emits the corresponding `<Column>#Id` property.
- Support all five Choice columns in the mapping layer, while only including fields supplied by the caller.
- Update request creation to map `Departemen`, `Tujuan`, and initial `CurrentStatus = Submitted` through the shared mapping layer.
- Replace the direct update-hook passthrough with an application hook that maps any changed Choice values before calling the generated SharePoint update service.
- Preserve non-Choice changed fields in partial updates and prevent domain-only `*Key` properties from being sent to SharePoint.
- Keep read normalization for SharePoint Choice objects so list and detail views continue receiving domain keys.
- Improve write errors to identify the specific Choice column and label that is missing from SharePoint metadata.
- Keep generated connector files intact where possible; place application-specific mapping in the vehicle request hook so regeneration does not erase the fix.

## Verification
- Type-check create payloads for the three form-supplied Choice columns.
- Type-check partial update payloads for all five Choice columns.
- Confirm the connector receives scalar numeric `#Id` fields, not domain keys or raw Choice labels.
- Validate the complete project and SDK usage with zero errors.
