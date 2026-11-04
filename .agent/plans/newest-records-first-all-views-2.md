# Newest records first across all views

## Goal
Ensure the latest vehicle and Extra Meal submissions always appear at the top of requester and admin tables.

## Changes
- **Dashboard Saya:** Sort the unified vehicle and Extra Meal request list by the full request creation timestamp, newest first, before pagination.
- **Admin Kendaraan:** Keep the default table order newest first, while preserving optional user-selected sorting by Request ID or requester.
- **Admin Extra Meal:** Sort grouped requests by the newest creation timestamp in each Request ID, newest group first, while preserving chronological ordering of daily records inside an expanded group.
- **Vehicle submissions:** Save a full date-and-time creation value instead of a date-only value so requests submitted on the same day can be ordered correctly.
- **Extra Meal submissions:** Place newly created records at the front of the query cache and retain timestamp-based ordering after SharePoint refresh.
- **SharePoint date handling:** Use one consistent newest-first comparator with SharePoint ID/record ID as a deterministic fallback when timestamps are missing or identical.
- **Pagination and filters:** Reset affected tables to page one when fresh data changes the result set, so the newest request is immediately visible.

## What stays the same
- Existing filters, search, pagination controls, grouping, status logic, and manual column sorting.
- Extra Meal daily rows remain ordered by service date inside each request group.
- SharePoint remains the source of truth; no data-model changes are required.

## Verification
- Submit two vehicle requests on the same day and confirm the later submission appears first on Dashboard Saya and Admin Kendaraan.
- Submit two Extra Meal request groups and confirm the later group appears first on Dashboard Saya and Admin Extra Meal.
- Confirm filters and pagination do not move the newest matching request away from the first row.
- Confirm manual Request ID/requester sorting still works and the default returns to newest-first after reload.
