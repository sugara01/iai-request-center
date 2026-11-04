# Fix dual-language consistency

## Goal
Ensure the Indonesian/English selector consistently translates all user-facing application content, with immediate priority on the `/` dashboard and shared navigation.

## Changes
- Expand the Indonesian-to-English translation catalog for missing dashboard terms, detail labels, durations, group controls, accessibility labels, loading states, notifications, and shared sidebar information.
- Update the `/` dashboard so request types, vehicle destinations, detail rows, statuses, date-related units, filters, table content, pagination, and detail sheets follow the selected language.
- Standardize shared navigation and sidebar labels, including data-source and developer information, while keeping product names and proper names unchanged.
- Audit requester pages, request forms, confirmation and success summaries, guides, vehicle administration, Extra Meal administration, admin access, workflow guidance, and not-found/loading states for untranslated or mixed-language UI.
- Ensure dynamic text and values use the selected locale, including dates, timestamps, quantities, status labels, toasts, dialog text, placeholders, titles, and ARIA labels.
- Preserve SharePoint keys and stored values; translate only their displayed labels so filtering, submission, and integration behavior remain unchanged.

## Verification
- Test switching between Bahasa Indonesia and English on `/` and every routed page, including dialogs, sheets, filters, empty/loading states, and success/error feedback.
- Confirm returning to Bahasa Indonesia restores Indonesian labels without stale English text.
- Run full project and SDK validation after the localization corrections.
