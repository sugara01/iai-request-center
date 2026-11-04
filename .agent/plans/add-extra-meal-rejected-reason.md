# Add Extra Meal rejection reason

## Goal
Ensure an Extra Meal admin must provide a clear rejection reason, save it to the existing SharePoint `ExtraMealReq.RejectedReason` column, and make the reason visible to the requester.

## Changes
- Refresh the ExtraMealReq data-source schema so the existing `RejectedReason` text column is available to the app.
- Extend the Extra Meal request model and SharePoint read/write mapping to include `RejectedReason`.
- In **Admin Extra Meal → Koreksi & Approval Request**, automatically show a multiline rejection-reason field when status is changed to `Rejected`.
- Require a non-empty rejection reason before a rejected group can be saved.
- Apply the same rejection reason and `Rejected` status to every daily record sharing the Request ID.
- Clear or omit the rejection reason when the selected status is not `Rejected`, avoiding stale reasons on later decisions.
- Show the saved rejection reason in the requester dashboard/detail experience for rejected Extra Meal requests.
- Show the saved rejection reason in the Admin Extra Meal record detail for operational review.
- Preserve the current grouped request workflow, approval statuses, cancellation behavior, pagination, and all vehicle-request behavior.

## Data entity
- ExtraMealReq

## Verification
- Confirm selecting `Rejected` reveals the required text field and prevents saving an empty reason.
- Confirm group save writes `RejectedReason` to all SharePoint rows for the Request ID.
- Confirm requester and admin details display the persisted reason after refresh.
- Confirm changing to a non-rejected status does not retain an obsolete rejection reason.
- Run full project validation with zero errors.
