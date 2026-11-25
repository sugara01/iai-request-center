# IAI Request Center

## Overview
IAI Request Center is a React and TypeScript application for vehicle and extra-meal requests. It keeps the requester dashboard, bilingual UI, admin monitoring, approval workflows, CSV export, and admin access management while using a PostgreSQL database.

## Roles
- **Requester** submits requests and follows their status on My Dashboard.
- **Vehicle admin** reviews availability, updates request details, records notes, and completes the Plant Director stage.
- **Meal admin** approves or rejects meal request groups, corrects quantities, and cancels eligible requests.
- **Super admin** manages vehicle and meal admin access.

Local development includes a demo-user selector. This is not production authentication and must be replaced with company identity authentication before deployment.

## Key scenarios
- Vehicle requests include date, time, pickup point, destination, department, passenger count, purpose, and notes. Approval is sequential: vehicle availability first, then Plant Director approval.
- Extra-meal requests create one database record per service date, sharing a Request ID. Weekend dates are excluded by default; approval, rejection, and cancellation apply to the group.
- Admins can monitor request status, filter and search records, export CSV, correct meal quantities, and view approval notes.
- Admin access and request changes are recorded in PostgreSQL; admin notifications are shown in the application. Users can switch between the default and neon-dark themes from the top bar.

## Design direction
Industrial-utilitarian interface with a dark navy sidebar, amber accent, compact typography, and operational tables. Bahasa Indonesia is the primary language, with an English option.

## Data and workflow
- **Database:** PostgreSQL 17 in Docker Desktop, with persistent storage in the `iai-postgres-data` volume.
- **API:** Express and `pg`, running locally on port 3001 and accessed through the Vite `/api` proxy.
- **Vehicle requests:** one row per request, with server-generated ticket numbers and status transitions enforced by the API.
- **Extra meal:** one row per service date, with a shared Request ID, unique Record ID, one approval trigger, and transactional group operations.
- **Admin access:** role assignments are stored in PostgreSQL and checked by the API.
- **Audit:** privileged writes are recorded in `audit_log`.
- **Notifications:** admin request queues are in-app only. Email and Power Automate integrations are not enabled in this configuration.

See [apps/extra-meal-request/README.md](../apps/extra-meal-request/README.md) for local setup.
