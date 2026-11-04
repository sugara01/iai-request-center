# Bilingual Indonesian and English

## Goal
- Make the entire IAI Request Center available in Bahasa Indonesia and English.
- Use Bahasa Indonesia on a user's first visit and remember the last selected language on that browser/device.
- Preserve all current routes, permissions, SharePoint mappings, workflows, data values, and business behavior.

## Language experience
- Add a clear language selector to the shared application layout so it is available from every route, including `/request-kendaraan`.
- Offer `Bahasa Indonesia` and `English`; changing the selection updates visible UI immediately without navigation or page reload.
- Save only the language preference locally; fall back safely to Bahasa Indonesia when no valid preference exists.
- Update the document language attribute and use the matching Indonesian or English locale for displayed dates and calendar labels.

## Translation coverage
- Shared shell: requester and administration navigation, loading/access states, data-source information, accessibility labels, common actions, pagination, sorting, empty states, and not-found/error experiences.
- Requester pages: dashboard, request center, vehicle request form, Extra Meal form, request detail, and the complete interactive requester guide.
- Admin pages: Admin Kendaraan, Admin Extra Meal, Workflow Request, and Kelola Admin.
- Feedback: confirmation dialogs, validation guidance, toast messages, SharePoint/API failure messages, delete prompts, export feedback, and loading text.
- Dynamic UI labels: request statuses, approval decisions, vehicle destinations, meal categories, yes/no values, units, and date/time descriptions.
- Export output: localize CSV column headings and presentation labels while keeping underlying record values and identifiers intact.

## Content structure
- Introduce one typed language context/hook as the single source of truth for the active language.
- Centralize Indonesian and English translation dictionaries with interpolation and plural-aware text for counts such as days, records, meals, passengers, and results.
- Keep SharePoint keys, model enums, route paths, Request IDs, Record IDs, emails, user-entered content, and stored status values unchanged; translate only their displayed labels.
- Keep generated data-layer files unchanged and adapt labels at the UI boundary to avoid breaking regeneration or SharePoint mappings.

## Quality checks
- Verify language switching and persistence across refreshes and route changes.
- Verify both languages on all requester/admin routes, dialogs, guides, tables, filters, pagination, exports, toasts, errors, and responsive layouts.
- Confirm Indonesian remains the first-visit default and unsupported stored values fall back to Indonesian.
- Confirm request submission, approval-related states, delete actions, sorting, filtering, SharePoint reads/writes, and permissions behave exactly as before.
- Run full project validation after implementation and resolve all type, lint, build, and SDK issues.

## Data and integrations
- No new SharePoint list, connector, table, or data-model change is required.
- Existing SharePoint records remain language-neutral; localization is applied only when rendering the application UI and exported presentation labels.
