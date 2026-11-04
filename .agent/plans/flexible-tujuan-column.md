# Flexible Tujuan Column

## Goal
Improve the `/admin-kendaraan` table so the Tujuan column is comfortable to scan without producing unnecessarily tall rows.

## Changes
- Increase the default Tujuan column width from the current narrow setting to a balanced desktop width.
- Add a visible, accessible resize control on the Tujuan header so users can drag the column wider or narrower.
- Apply sensible minimum and maximum widths so resizing does not hide the content or overwhelm the remaining columns.
- Keep destination text wrapping within the selected width so long “Tujuan Lainnya” values remain readable without extending indefinitely to the right.
- Keep the existing table data, filters, sorting, pagination, row actions, detail sheet, and horizontal table scrolling unchanged.
- Ensure the resized width is applied consistently to the Tujuan header and every Tujuan cell for the current page session.

## Verification
- Confirm the column starts wider than it does today and typical destination values use fewer lines.
- Confirm dragging the resize control changes only the Tujuan column and respects its minimum and maximum limits.
- Confirm long text still wraps and all other columns remain reachable through the existing horizontal scroll area.
- Run full project validation, including TypeScript, build, and SDK checks.