# Repair Office 365 Users runtime binding

## Goal
Eliminate `Execute operation failure: Data source not found: office365users` by rebuilding the Office 365 Users connector as a real Power Apps Code App runtime data source and proving that the published runtime can execute user search.

## Current findings
- App: `apps/extra-meal-request` (`appId` `19cf8733-3a95-48dd-9067-4ac3c06026e3`).
- Generated service requests the exact data-source name `office365users` in lowercase.
- `power.config.json` claims `office365users` under connector `/providers/Microsoft.PowerApps/apis/shared_office365users`, but its connection-reference key `5190788c-8c32-4177-983d-6d80ece4e6a5` does not match either currently available Office 365 Users connection ID.
- Available connection IDs are `238a2f125f96457fb02ddc955864b39b` and `6569fd94cc0547318c04ea47d7196a34`.
- Connector schema and generated TypeScript exist, but their presence does not prove that the app runtime has a valid connection binding.
- No active Power Platform environment ID is recorded in the inspected app configuration; it must be obtained from the active connection/environment context during repair.

## Changes
- Remove the stale Office 365 Users connection reference and its generated `.power` schema/data-source metadata before re-registration; do not preserve generated service/model files as authoritative state.
- Refresh the active Power Platform environment and enumerate both existing `shared_office365users` connections to identify which connection is valid in that environment.
- Register the verified connection against `apps/extra-meal-request` through the platform connector-registration flow so it becomes an actual app data source.
- Regenerate connector metadata and TypeScript only after runtime registration succeeds.
- Confirm one canonical data-source name across `power.config.json`, `.power/appschemas/dataSourcesInfo.ts`, generated connector metadata, and `Office365UsersService`: `office365users` with exact lowercase casing.
- Remove duplicate, orphaned, or stale Office 365 Users references while leaving SharePoint registrations unchanged.

## Runtime verification
- Exercise `Office365UsersService.TestConnection()` in the hosted Code App runtime.
- Exercise `Office365UsersService.SearchUserV2(...)` from the admin assignment flow with a known search term and verify that results are returned without a missing-data-source error.
- Verify the `/` route still loads and the `/kelola-admin` autocomplete remains functional.
- Run full project and SDK validation after the runtime checks.

## Completion report
- Report the final registered data-source name and casing.
- Report connector ID, selected connection ID, and active environment ID.
- Report the runtime test result for both `TestConnection` and `SearchUserV2`.
- List every changed or regenerated file, distinguishing runtime registration metadata from generated TypeScript artifacts.
