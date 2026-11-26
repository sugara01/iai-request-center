# IAI Request Center

React/TypeScript requester and admin application with a PostgreSQL-backed API.

## Local development

Prerequisites: Docker Desktop, Node.js 20 or newer, and npm.

1. Start PostgreSQL from this directory:

   ```powershell
   docker compose up -d postgres
   ```

   Docker initializes the schema and fictional demo records on the first database start. PostgreSQL data persists in the `iai-postgres-data` volume.

2. Install the API dependencies:

   ```powershell
   npm install --prefix server
   ```

   The API uses `postgres://iai_app:local-dev-only@localhost:5434/iai_request_center` by default and listens on port 3001. Override these with `DATABASE_URL` and `API_PORT` environment variables if needed. The container maps PostgreSQL to host port 5434 to avoid conflicting with existing local databases; set `POSTGRES_PORT` to change it.

3. Install frontend dependencies and start both the API and Vite:

   ```powershell
   npm install
   npm run dev
   ```

   Open http://localhost:5173. Vite proxies `/api` requests to the API on port 3001. Start PostgreSQL before `npm run dev`; otherwise the API cannot start and API requests will fail.

Sign in using the email and password of an active account. The seeded SuperAdmin account is `riyan.sugara@ineos.com` with the initial password `ineos123`; change this password at first sign-in. New accounts and password resets also require a password change. The adjacent moon/sun button switches between the default and neon-dark themes and remembers the selection. Email notifications are not configured.

ITAdmins and SuperAdmins can open **Kelola Pengguna** to add and edit users, change system roles and workflow permissions, enable or disable accounts, reset passwords, or import an Active Directory CSV. Only a SuperAdmin can grant or manage another SuperAdmin account. CSV imports upsert by email. Supported headers include `sAMAccountName`, `mail` or `userPrincipalName`, `displayName`, `department`, `title`, `role`, `vehicle_admin`, `meal_admin`, and `approver_doa`. New accounts and password resets receive the initial password `ineos123`; only a scrypt hash is stored and `must_change_password` is set. Authentication uses an HttpOnly session cookie backed by revocable database sessions. Configure `JWT_SECRET` to a persistent random value of at least 32 bytes in production; development generates a temporary secret at API startup, so restarting the API signs out active sessions.

The Inbox provides a role-protected Pending Approvals queue and personal in-app Notifications. Vehicle and Extra Meal actions use the existing workflow permissions; `approver_doa` is not used for authorization. New request assignments, final approval decisions, and password resets create user-scoped notifications. Email delivery is not configured.

The database schema and seed records are in `server/schema.sql`. The API applies this idempotent schema at startup and imports legacy `admin_access` records only for accounts not yet present in `users`; existing `users` roles and permissions remain authoritative. The legacy table is retained for migration/bootstrap compatibility and no longer has a management page or API. Docker initialization scripts run only when the data volume is empty; future structural changes still require an explicit migration.
