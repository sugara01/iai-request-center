# Near-real-time SharePoint sync

## Goal
Keep request data, approval status, and admin notification counts synchronized across open devices without requiring manual refresh.

## Changes
- Apply automatic SharePoint refresh every 15 seconds to vehicle requests and Extra Meal requests while the application tab is active.
- Refresh immediately when the user returns to the application tab or the device reconnects to the network.
- Pause background polling when the tab is not active to limit SharePoint traffic.
- Preserve immediate local refresh after submit, approve, reject, correction, cancellation, and deletion actions.
- Keep the existing manual Refresh buttons as a fallback.
- Ensure Dashboard Saya, Admin Kendaraan, Admin Extra Meal, and admin approval notifications use the same refreshed query data.
- Show a compact automatic-sync state and last-updated time on the Dashboard and both admin views.
- Avoid resetting active filters, pagination, expanded rows, or open dialogs when background data refreshes.

## Expected behavior
- A newly submitted request appears on another active device within approximately 15 seconds.
- An approval or rejection appears on the requester's active Dashboard within approximately 15 seconds.
- Admin notification badges update with the same synchronization cycle.
- Returning to a previously inactive tab triggers an immediate refresh.

## Scope retained
- SharePoint remains the source of truth.
- Existing request workflows, permissions, sorting, filters, and manual refresh controls remain unchanged.
- This is near-real-time polling; no webhook, Power Automate, WebSocket, or external push service is introduced.

## Validation
- Verify cross-device create and approval flows for both Kendaraan and Extra Meal.
- Verify polling stops for inactive tabs and resumes immediately on focus.
- Verify background refresh does not cause dialog loops, page resets, or duplicate requests.
- Run full project and connector SDK validation.
