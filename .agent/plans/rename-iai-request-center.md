# Rename app to IAI Request Center

## Goal
- Replace the remaining **Extra Meal Request** application identity with **IAI Request Center**.
- Use the description: **Central semua pengajuan di IAI berbasis SharePoint dengan dashboard requester, reminder approval, dan kontrol admin.**

## Changes
- Update the Code App display name and description in `apps/extra-meal-request/power.config.json` while preserving the existing app ID, connections, and data-source registrations.
- Align `project.json` project description with the new requested description; keep the existing project name **IAI Request Center**.
- Update the browser page title from the template title to **IAI Request Center**.
- Confirm the shared sidebar branding remains **IAI Request Center**, including when the user is on `/buat-request`.
- Align `docs/overview.md` summary with the new centralized SharePoint request-center description.

## Unchanged
- Keep the `/buat-request` page layout, request options, routes, permissions, workflows, SharePoint entities, and connector bindings unchanged.
- Keep the existing application directory and technical identifiers unchanged.

## Verification
- Confirm no user-facing or deployment metadata still identifies the app as **Extra Meal Request**.
- Validate the project after the metadata and title updates.
