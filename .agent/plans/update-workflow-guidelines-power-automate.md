# Update Workflow Request Guidelines

## Goal
Align the Workflow Request menu with the actual in-app logic for Vehicle and Extra Meal requests, while clearly defining Power Automate as the owner of requester-manager enrichment and final-status email notifications.

## Changes
- Update the Workflow Request page so the Vehicle and Extra Meal diagrams, status transitions, approval roles, correction paths, cancellation rules, and grouped Request ID behavior match the current application.
- Document Vehicle flow from `Submitted` through Admin availability review, Plant Director approval when required, and the final Approved, Rejected, or Cancelled states.
- Document Extra Meal flow as a Request ID group: one approval trigger represents all dated rows, and approve, reject, correction, and cancel apply to the entire group.
- Show that Cancel is available only while a request is in progress and is disabled after Approved, Rejected, or Cancelled.
- Remove any guidance implying that the app or Office 365 connector resolves the requester’s manager.
- Define Power Automate as responsible for resolving and updating `RequesterManager` in SharePoint for both request types.
- Define Power Automate email notifications to the requester as final-status notifications only: Approved or Rejected.
- Clarify that intermediate statuses, corrections, and cancellations remain visible in the application but do not send requester email unless the workflow is changed later.
- Keep the Workflow Request content bilingual wherever the page currently supports Indonesian and English.

## Workflow boundaries
- **Application:** create requests, display progress, perform role-based review and correction, update request/group statuses, enforce final-state cancellation rules, and show approval notes.
- **Power Automate:** populate `RequesterManager`, orchestrate approval integration where applicable, write approval outcomes back to SharePoint, and email the requester only when the final result is Approved or Rejected.
- **SharePoint:** remain the source of truth for Vehicle, Extra Meal, status, notes, manager, and audit records.

## Data entities
- RequestKendaraan
- ExtraMealReq
- AdminAcess

## Documentation
- Update the project overview workflow boundary to match the revised responsibilities and notification policy.

## Acceptance criteria
- Workflow Request accurately represents both live request flows and all supported statuses.
- Extra Meal grouped actions are explicitly explained as applying to all rows sharing one Request ID.
- Vehicle and Extra Meal both show the same final-state cancellation restriction.
- No workflow guidance depends on the Office 365 connector for manager lookup.
- `RequesterManager` ownership is clearly assigned to Power Automate.
- Requester email is described only for Approved and Rejected outcomes.
- Existing request forms, dashboards, admin actions, and data structures remain unchanged unless needed to correct contradictory workflow copy.
- Project validation passes after implementation.
