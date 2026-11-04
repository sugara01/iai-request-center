# Lock vehicle approval stages

## Goal
- Enforce a sequential approval workflow on `/admin-kendaraan`: Vehicle Admin decides availability first, then the Plant Director decision becomes actionable.

## Approval behavior
- Treat `Belum ada keputusan` as an undecided admin state and keep the Plant Director decision and note read-only.
- Keep the Vehicle Admin decision and note editable only while no valid admin decision has been saved.
- When Vehicle Admin saves `Available`, set the request to `Pending Plant Director Approval`, lock the saved admin decision and note, and enable the Plant Director decision and note.
- When Vehicle Admin saves `Not Available`, set the request directly to `Rejected - Vehicle not available`; both stages remain read-only because the request is final.
- When Plant Director saves `Approved` or `Rejected`, set the matching final status and keep both decision stages read-only.
- Allow all users who already have Admin Kendaraan access to perform both stages; do not introduce a new role or access table field.

## UI changes
- Update the vehicle correction/approval dialog to clearly show which approval stage is active and why the other stage is locked.
- Disable the Admin decision control and Admin note after an admin decision has been persisted, rather than allowing the same dialog session to silently redefine the completed stage.
- Disable the Plant Director decision and note until the persisted Admin decision is `Available`.
- Prevent editing approval fields for final requests while retaining the existing read-only details and operational monitoring views.
- Keep trip correction fields, tables, filters, exports, cancellation rules, and navigation unchanged.

## Save safeguards
- Validate the workflow again in the save handler so disabled UI cannot be bypassed with an invalid combined update.
- Save only fields belonging to the currently active stage and preserve previously stored decisions and notes.
- Continue using the existing SharePoint fields and status labels; no data-model or connector changes are required.

## Documentation and verification
- Align the Power Automate workflow guide text with the locked two-stage behavior and clarify that `Not Available` is final.
- Verify these scenarios: undecided admin, Available awaiting Plant Director, Not Available final, Plant Director Approved final, Plant Director Rejected final, and reopening each state.
- Run full project validation after implementation.