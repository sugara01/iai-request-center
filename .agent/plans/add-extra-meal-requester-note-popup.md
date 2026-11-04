# Add requester note to Extra Meal detail popup

## Goal
Show the requester’s notes or additional meal/drink request in the Extra Meal detail popup on Dashboard Saya (`/`) so the request context is complete.

## Changes
- Update the grouped Extra Meal detail popup to display the existing `AdditionalRequest` value with the label **Catatan atau Tambahan dari requester**.
- Update the per-date Extra Meal detail popup to display the same requester information because all daily records belong to the same Request ID group.
- Show `-` when the requester did not provide any additional information.
- Add the English localization **Requester notes or additional information** for the new label.

## Data
- Reuse the existing Extra Meal `AdditionalRequest` / `additional` data already loaded from SharePoint.
- No data-model, SharePoint schema, connector, form, or workflow changes.

## Unchanged
- Vehicle detail popup and its requester/admin/Plant Director notes.
- Extra Meal grouping, statuses, approval behavior, and daily-record expansion.
- Existing Extra Meal submission field and saved data.

## Validation
- Verify both grouped and daily Extra Meal detail popups on `/` show the field in Indonesian and English.
- Verify empty values render as `-` and existing additional requests render without truncating the text.
- Run full project validation.
