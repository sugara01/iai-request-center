# Add requester notifications

## Goal
- Add in-app bell notifications for ordinary requesters when their own Vehicle or Extra Meal requests reach a final Approved or Rejected status.

## User experience
- Show one notification bell in the shared header for every signed-in user, while preserving the existing admin approval queue behavior for authorized admins.
- Show a badge count for unread requester results and distinguish Approved from Rejected with the existing semantic status styling.
- List Vehicle and Extra Meal results together, newest first, using the latest SharePoint status-update timestamp where available and creation timestamp as fallback.
- Show one notification per Vehicle Request ID and one notification per Extra Meal Request ID, even when Extra Meal contains multiple daily records.
- Limit requester notifications to records whose requester email matches the signed-in user's email.
- Include request type, Request ID, final status, relevant decision note, and result time in each notification.
- Clicking a notification opens Dashboard Saya and automatically opens the matching request detail panel.
- Mark the clicked result as read and remove it from the unread badge without changing the request status.
- Provide a clear empty, loading, and data-error state in the notification popover.

## Data
- Continue using RequestKendaraanApps and ExtraMealReq as the source of truth for request ownership and final status.
- Add a User Notification Read State entity to persist read status per signed-in user and request result across sessions and devices.
- Keep requester read state separate from AdminAccess and from the request records themselves.

## Dashboard changes
- Support a Request ID query parameter on Dashboard Saya.
- Resolve the query parameter only against requests owned by the signed-in user.
- Open Vehicle details directly or the grouped Extra Meal detail directly, then remove or retain the URL parameter consistently so refresh and back navigation remain predictable.

## Existing behavior retained
- Keep the current admin menu badges, admin bell queue, AdminAccess authorization, SharePoint request queries, sorting, approval dialogs, and email workflow unchanged.
- Do not notify requesters for Submitted, Pending Plant Director Approval, Cancelled, corrections, or mixed Extra Meal groups that have not reached one final result.
- Do not expose another user's request through URL manipulation.

## Verification
- Verify requester filtering, Approved and Rejected results for both request types, one-notification-per-Extra-Meal-group behavior, unread persistence, click-through detail opening, admin and non-admin combinations, refresh behavior, and unauthorized Request ID handling.
- Run full project validation and SDK usage validation after implementation.