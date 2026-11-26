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

Choose a local demo identity from the selector in the top bar to try requester, vehicle-admin, meal-admin, and super-admin views. The adjacent moon/sun button switches between the default and neon-dark themes and remembers the selection. Demo authentication is intentionally limited to non-production environments; do not expose this setup to a network or use it for real employee data. Email notifications are not configured.

The database schema and seed records are in `server/schema.sql`. Docker only runs initialization scripts when the data volume is empty; changing the schema later requires a database migration.
