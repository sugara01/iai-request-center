# Fix extra meal admin menu flicker

## Goal
Keep **Admin Extra Meal** and **Pengaturan Meal** stable while the current user identity is loading, then show or hide them only after authorization is resolved.

## Changes
- Update the shared sidebar authorization state so loading is distinct from authorized and unauthorized states.
- Prevent the temporary fallback email state from initially granting meal-admin access.
- Keep the two meal administration links visible only for email addresses listed in the meal admin configuration after user context resolves.
- Preserve the existing vehicle-admin rules, routes, page content, SharePoint integration, and overall sidebar design.
- Add a neutral loading treatment for the administration navigation area so menu items do not flash and disappear.

## Verification
- Confirm a non-meal-admin user never sees **Admin Extra Meal** or **Pengaturan Meal** during initial load or afterward.
- Confirm a configured meal admin sees both links after identity resolution and can navigate to both pages.
- Confirm user-context loading and failure states do not accidentally grant admin access.
- Validate the project for TypeScript, lint, and SDK usage errors.

## Data model synchronization
- `AdminAcess` is now part of the generated data model.
- `/kelola-admin` uses `Title` as the normalized user email and `VehicleAdmin` / `MealAdmin` as role flags.
- Regenerate the data layer after model changes and keep Riyan's super-admin fallback plus route protection intact.
