# Fix admin date filter translations

## Changes
- Update the shared operational analytics filter used by Admin Kendaraan and Admin Extra Meal so all period options follow the active language.
- Add English labels for `7 hari terakhir`, `30 hari terakhir`, `Bulan berjalan`, and `Semua data`.
- Localize the surrounding filter accessibility label, operational summary heading, updated timestamp label, and timestamp locale for consistency.

## What stays the same
- Keep period values and filtering behavior unchanged: `7d`, `30d`, `month`, and `all`.
- Keep the current layout, dashboard cards, SharePoint data sources, and admin page routes unchanged.

## Verification
- Confirm switching to English shows `Last 7 days`, `Last 30 days`, `Current month`, and `All data` on both admin pages.
- Confirm switching back to Indonesian restores the original labels.
- Confirm each option still filters the same date range and project validation passes.
