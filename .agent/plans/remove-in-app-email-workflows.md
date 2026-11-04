# Remove in-app email workflows

## Goal
Ensure the Code App only creates or updates request data while all email notifications, approvals, and vehicle `CurrentStatus` updates remain owned by the existing Power Automate flows.

## Changes
- Audit vehicle and extra-meal submission, approval, and administration paths for direct Outlook sends or duplicate email/approval actions.
- Remove any remaining application-side email sending logic and Office 365 Outlook runtime dependency that is no longer used.
- Keep SharePoint item creation and ordinary data updates required to trigger the existing Power Automate workflows.
- Keep vehicle `CurrentStatus` initialized to `Submitted`; do not let the app duplicate subsequent status updates owned by Power Automate.
- Keep the existing requester and admin pages, role access, forms, and SharePoint admin-access behavior unchanged.
- Update submission confirmations and workflow guidance so they accurately state that Power Automate handles email, approval, and downstream status updates.
- Update the project overview to document the boundary between the Code App and Power Automate.

## Data sources
- Retain SharePoint data sources for `RequestKendaraan` and `AdminAcess`.
- Remove the Office 365 Outlook data-source registration if no remaining application feature consumes it.
- Do not change the SharePoint schema or introduce new entities.

## Verification
- Confirm no application source imports or calls the Office 365 Outlook generated service.
- Confirm vehicle and extra-meal submission paths only persist request data and do not send email.
- Confirm admin actions do not invoke email or duplicate Power Automate approval/status logic.
- Validate the project after configuration and code cleanup.
