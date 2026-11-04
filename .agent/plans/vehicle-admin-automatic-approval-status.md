# Vehicle admin automatic approval status

## Goal
Update the **Koreksi request kendaraan** flow on `/admin-kendaraan` so approval status is derived automatically from the Admin and Plant Director decisions instead of being manually selected.

## Changes
- Keep the existing Admin Kendaraan page, request table, detail view, action icons, cancellation, deletion, filters, and operational correction fields unchanged.
- Restrict **Keputusan Admin** to two options: **Available** and **Not Available**.
- Replace the editable **Status approval** selector with a read-only text box.
- Automatically set **Status approval** to **Pending Plant Director Approval** when Keputusan Admin is **Available** and no final Plant Director decision has been made.
- Automatically set **Status approval** to **Rejected - Vehicle not available** when Keputusan Admin is **Not Available**.
- Allow **Keputusan Plant Director** to provide the final decision after the Admin selects **Available**.
- Automatically set **Status approval** to **Approved** when the Plant Director decision is **Approved**.
- Automatically set **Status approval** to **Rejected - Plant Director** when the Plant Director decision is **Rejected**.
- Clear or disregard an incompatible Plant Director decision when the Admin changes the decision to **Not Available**, so the saved decision and derived status remain consistent.
- Apply the same derivation both while editing and immediately before saving, then persist the resulting text through the existing SharePoint vehicle-request update flow.
- Ensure the table status badge, detail panel, filters, CSV export, and dashboard counts display the new derived status values consistently.

## Approval precedence
- Admin = **Not Available** → **Rejected - Vehicle not available**.
- Admin = **Available**, Plant Director = **Approved** → **Approved**.
- Admin = **Available**, Plant Director = **Rejected** → **Rejected - Plant Director**.
- Admin = **Available**, Plant Director not decided → **Pending Plant Director Approval**.
- No Admin decision → retain the request’s existing initial status until an Admin decision is selected.

## Validation
- Verify each decision combination produces and saves the expected read-only approval status.
- Verify reopening a corrected request shows the saved decisions and derived status.
- Verify existing cancel/delete actions and Admin Extra Meal behavior remain unchanged.
- Run full project validation and SDK usage checks with zero errors.
