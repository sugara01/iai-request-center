# Add admin request notifications

## Goal
- Add role-aware notification counts and a notification bell so authorized admins can immediately find requests that still require action.

## User-facing changes
- Show a numeric badge beside **Admin Kendaraan** for actionable vehicle requests visible to vehicle admins.
- Show a numeric badge beside **Admin Extra Meal** for actionable Extra Meal Request IDs visible to meal admins.
- Add one notification bell in the header for users authorized through `AdminAccess`, combining only the services they are allowed to administer.
- Open a compact notification list from the bell with request type, Request ID, requester, current status, and creation time.
- Sort the combined list newest-first using vehicle `CreatedDate` and Extra Meal `RequestCreatedAt`.
- Navigate from a notification to the appropriate admin page and automatically open **Koreksi & Approval** for that request.
- Show clear loading, empty, and data-load failure states without blocking normal navigation or language controls.

## Notification rules
- Vehicle notifications include requests in `Submitted` and `Pending Plant Director Approval`.
- Extra Meal notifications count once per Request ID when any record remains `Submitted` or the group has mixed statuses.
- Vehicle-only admins see vehicle notifications; meal-only admins see Extra Meal notifications; users with both roles see the combined queue.
- Counts are derived directly from existing SharePoint request lists; no read/unread tracking or new notification table is added.

## Admin page behavior
- Support a request-target parameter when opening **Admin Kendaraan** or **Admin Extra Meal** from the notification list.
- Resolve the target after SharePoint data loads, then open the existing correction and approval dialog.
- For Extra Meal, resolve the Request ID to its grouped records and use the representative group record for the existing group-wide correction dialog.
- If a target no longer exists or is no longer actionable, keep the admin page usable and show an informational message instead of opening a stale dialog.
- Clear or consume the target parameter after opening so closing the dialog does not immediately reopen it.

## Data freshness
- Reuse the existing vehicle and Extra Meal React Query caches so sidebar badges, the bell, and admin pages stay consistent.
- Rely on existing query invalidation after approve, reject, cancel, edit, or delete so counts and the combined queue refresh after processing.
- Let manual refresh actions update the same shared cache and notification counts.

## Scope retained
- Keep the current `AdminAccess` authorization model, routes, SharePoint schemas, approval forms, dashboard behavior, and language selector.
- Do not add email delivery, browser push notifications, persistent read/unread state, or new SharePoint entities.

## Verification
- Verify each role combination sees only permitted menu badges and notification items.
- Verify vehicle and Extra Meal counts follow their respective actionable rules and count Extra Meal once per Request ID.
- Verify newest-first ordering uses SharePoint creation timestamps.
- Verify clicking each notification opens the correct admin correction dialog.
- Verify processing a request updates the counts/list and unauthorized routes remain protected.
- Run full project validation after implementation.