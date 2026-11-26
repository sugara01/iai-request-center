import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import express from 'express';
import pg from 'pg';
import { CsvImportError, DEFAULT_USER_PASSWORD, hashPassword, parseUserCsv } from './user-management.mjs';

const { Pool } = pg;
const port = Number(process.env.API_PORT ?? 3001);
const demoAuthEnabled = process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEMO_AUTH !== 'false';
const validUserRoles = new Set(['User', 'ITAdmin', 'SuperAdmin']);
const managedUserColumns = `id, username, email, display_name, department, job_title,
  is_active, must_change_password, role, vehicle_admin, meal_admin, approver_doa,
  created_at, updated_at, last_login`;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://iai_app:local-dev-only@localhost:5434/iai_request_center',
});

const demoUsers = [
  { email: 'ayu.lestari@example.com', fullName: 'Ayu Lestari' },
  { email: 'aris.kristanto@ineos.com', fullName: 'Aris Kristanto' },
  { email: 'defiani.defiani@ineos.com', fullName: 'Defiani' },
  { email: 'sri.aditia.demo@local.test', fullName: 'Sri Aditia (demo)' },
  { email: 'riyan.sugara@ineos.com', fullName: 'Riyan Sugara', jobTitle: 'IT Project & Developer' },
];
const vehicleColumns = `id, request_number, requester_name, requester_email, department_key,
  pickup_date::TEXT AS pickup_date, pickup_time, pickup_point, destination_key, destination_other,
  purpose, requester_note, passenger_count, current_status_key, admin_decision_key, admin_note,
  director_decision_key, director_note, created_at, last_update`;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', database: 'postgresql' });
});

app.get('/api/demo-users', async (_req, res) => {
  if (!demoAuthEnabled) throw new HttpError(404, 'Local demo sign-in is disabled.');
  const { rows } = await pool.query('SELECT email, display_name FROM users WHERE is_active = TRUE ORDER BY email');
  const users = new Map(demoUsers.map((user) => [user.email, user]));
  for (const row of rows) {
    users.set(row.email, { email: row.email, fullName: row.display_name });
  }
  res.json([...users.values()]);
});

app.use('/api', async (req, _res, next) => {
  if (!demoAuthEnabled) return next(new HttpError(503, 'Demo authentication is disabled. Configure production authentication before deployment.'));
  const email = String(req.header('x-demo-user') ?? '').trim().toLowerCase();
  const { rows } = await pool.query(
    'SELECT email, display_name, job_title, is_active FROM users WHERE email = $1',
    [email],
  );
  const user = rows[0];
  if (user && !user.is_active) return next(new HttpError(403, 'This user account is disabled.'));
  const demoUser = demoUsers.find((candidate) => candidate.email === email);
  if (!user && !demoUser) return next(new HttpError(401, 'Select a valid local demo user.'));
  req.demoUser = user
    ? { email: user.email, fullName: user.display_name, jobTitle: user.job_title }
    : demoUser;
  next();
});

app.get('/api/session', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT role, vehicle_admin, meal_admin, approver_doa
     FROM users WHERE email = $1 AND is_active = TRUE`,
    [req.demoUser.email],
  );
  const access = rows[0] ?? {};
  res.json({
    userPrincipalName: req.demoUser.email,
    fullName: req.demoUser.fullName,
    jobTitle: req.demoUser.jobTitle ?? null,
    role: access.role ?? 'User',
    isITAdmin: access.role === 'ITAdmin',
    isVehicleAdmin: Boolean(access.vehicle_admin),
    isMealAdmin: Boolean(access.meal_admin),
    isSuperAdmin: access.role === 'SuperAdmin',
    isApproverDoa: Boolean(access.approver_doa),
  });
});

app.get('/api/users', async (req, res) => {
  await requireUserAdmin(req);
  const { rows } = await pool.query(`SELECT ${managedUserColumns} FROM users ORDER BY display_name, email`);
  res.json(rows.map(mapManagedUser));
});

app.post('/api/users', async (req, res) => {
  const actorRole = await requireUserAdmin(req);
  const user = readUserInput(req.body, true);
  if (user.role === 'SuperAdmin' && actorRole !== 'SuperAdmin') {
    throw new HttpError(403, 'Only a SuperAdmin can create another SuperAdmin.');
  }
  const passwordHash = await hashPassword(DEFAULT_USER_PASSWORD);
  const { rows } = await queryUserWrite(
    `INSERT INTO users (
       username, email, display_name, department, job_title, password_hash,
       is_active, must_change_password, role, vehicle_admin, meal_admin, approver_doa
     )
     VALUES ($1, $2, $3, $4, $5, $6, TRUE, TRUE, $7, $8, $9, $10)
     RETURNING ${managedUserColumns}`,
    [
      user.username, user.email, user.displayName, user.department, user.jobTitle, passwordHash,
      user.role, user.vehicleAdmin, user.mealAdmin, user.approverDoa,
    ],
  );
  await writeAudit(req.demoUser.email, 'user', user.email, 'create', { role: user.role });
  res.status(201).json(mapManagedUser(rows[0]));
});

app.patch('/api/users/:id', async (req, res) => {
  const actorRole = await requireUserAdmin(req);
  const id = parseId(req.params.id);
  const user = readUserInput(req.body, false);
  const current = await getManagedUser(id);
  if (!current) throw new HttpError(404, 'User was not found.');
  if (actorRole !== 'SuperAdmin' && current.role === 'SuperAdmin') {
    throw new HttpError(403, 'Only a SuperAdmin can edit a SuperAdmin account.');
  }
  if (user.role === 'SuperAdmin' && actorRole !== 'SuperAdmin') {
    throw new HttpError(403, 'Only a SuperAdmin can assign the SuperAdmin role.');
  }
  if (current.role === 'SuperAdmin' && user.role !== 'SuperAdmin') {
    await requireAnotherSuperAdmin(id);
  }

  const { rows } = await queryUserWrite(
    `UPDATE users
     SET username = $2, display_name = $3, department = $4, job_title = $5,
         role = $6, vehicle_admin = $7, meal_admin = $8, approver_doa = $9,
         updated_at = NOW()
     WHERE id = $1
     RETURNING ${managedUserColumns}`,
    [
      id, user.username, user.displayName, user.department, user.jobTitle,
      user.role, user.vehicleAdmin, user.mealAdmin, user.approverDoa,
    ],
  );
  await writeAudit(req.demoUser.email, 'user', rows[0].email, 'update', {
    role: user.role,
    vehicleAdmin: user.vehicleAdmin,
    mealAdmin: user.mealAdmin,
    approverDoa: user.approverDoa,
  });
  res.json(mapManagedUser(rows[0]));
});

app.patch('/api/users/:id/status', async (req, res) => {
  const actorRole = await requireUserAdmin(req);
  const id = parseId(req.params.id);
  const isActive = requireBoolean(req.body?.isActive, 'isActive');
  const current = await getManagedUser(id);
  if (!current) throw new HttpError(404, 'User was not found.');
  if (actorRole !== 'SuperAdmin' && current.role === 'SuperAdmin') {
    throw new HttpError(403, 'Only a SuperAdmin can change a SuperAdmin account status.');
  }
  if (!isActive && current.email === req.demoUser.email) {
    throw new HttpError(400, 'You cannot disable the account currently administering users.');
  }
  if (!isActive && current.role === 'SuperAdmin') await requireAnotherSuperAdmin(id);

  const { rows } = await pool.query(
    `UPDATE users SET is_active = $2, updated_at = NOW()
     WHERE id = $1 RETURNING ${managedUserColumns}`,
    [id, isActive],
  );
  await writeAudit(req.demoUser.email, 'user', rows[0].email, isActive ? 'enable' : 'disable', {});
  res.json(mapManagedUser(rows[0]));
});

app.post('/api/users/:id/reset-password', async (req, res) => {
  const actorRole = await requireUserAdmin(req);
  const id = parseId(req.params.id);
  const current = await getManagedUser(id);
  if (!current) throw new HttpError(404, 'User was not found.');
  if (actorRole !== 'SuperAdmin' && current.role === 'SuperAdmin') {
    throw new HttpError(403, 'Only a SuperAdmin can reset a SuperAdmin password.');
  }
  const passwordHash = await hashPassword(DEFAULT_USER_PASSWORD);
  const { rows } = await pool.query(
    `UPDATE users SET password_hash = $2, must_change_password = TRUE, updated_at = NOW()
     WHERE id = $1 RETURNING email`,
    [id, passwordHash],
  );
  await writeAudit(req.demoUser.email, 'user', rows[0].email, 'reset_password', {});
  res.json({ message: 'Password reset to the initial password; it must be changed at first login.' });
});

app.post(
  '/api/users/import',
  express.text({ type: ['text/csv', 'text/plain'], limit: '5mb' }),
  async (req, res) => {
    const actorRole = await requireUserAdmin(req);
    let importedUsers;
    try {
      importedUsers = parseUserCsv(String(req.body ?? ''));
    } catch (error) {
      if (error instanceof CsvImportError) throw new HttpError(400, error.message);
      throw error;
    }

    const validatedUsers = importedUsers.map(validateImportedUser);
    if (actorRole !== 'SuperAdmin' && validatedUsers.some((user) => user.role === 'SuperAdmin')) {
      throw new HttpError(403, 'Only a SuperAdmin can import a SuperAdmin account.');
    }
    const seenEmails = new Set();
    for (const user of validatedUsers) {
      if (seenEmails.has(user.email)) throw new HttpError(400, `CSV contains duplicate email ${user.email}.`);
      seenEmails.add(user.email);
    }

    const { rows: existingRows } = await pool.query(
      'SELECT email, password_hash FROM users WHERE email = ANY($1::TEXT[])',
      [validatedUsers.map((user) => user.email)],
    );
    const existingPasswords = new Map(existingRows.map((row) => [row.email, row.password_hash]));
    const newUsers = validatedUsers.filter((user) => !existingPasswords.has(user.email));
    const newPasswordHashes = new Map();
    for (let index = 0; index < newUsers.length; index += 4) {
      const batch = newUsers.slice(index, index + 4);
      const hashes = await Promise.all(batch.map(() => hashPassword(DEFAULT_USER_PASSWORD)));
      batch.forEach((user, batchIndex) => newPasswordHashes.set(user.email, hashes[batchIndex]));
    }

    const client = await pool.connect();
    let created = 0;
    let updated = 0;
    try {
      await client.query('BEGIN');
      for (const user of validatedUsers) {
        const isExisting = existingPasswords.has(user.email);
        const passwordHash = isExisting ? existingPasswords.get(user.email) : newPasswordHashes.get(user.email);
        await client.query(
          `INSERT INTO users (
             username, email, display_name, department, job_title, password_hash,
             is_active, must_change_password, role, vehicle_admin, meal_admin, approver_doa
           )
           VALUES ($1, $2, $3, $4, $5, $6, TRUE, TRUE, $7, $8, $9, $10)
           ON CONFLICT (email) DO UPDATE SET
             username = EXCLUDED.username,
             display_name = EXCLUDED.display_name,
             department = CASE WHEN $11 THEN EXCLUDED.department ELSE users.department END,
             job_title = CASE WHEN $12 THEN EXCLUDED.job_title ELSE users.job_title END,
             role = CASE WHEN $13 THEN EXCLUDED.role ELSE users.role END,
             vehicle_admin = CASE WHEN $14 THEN EXCLUDED.vehicle_admin ELSE users.vehicle_admin END,
             meal_admin = CASE WHEN $15 THEN EXCLUDED.meal_admin ELSE users.meal_admin END,
             approver_doa = CASE WHEN $16 THEN EXCLUDED.approver_doa ELSE users.approver_doa END,
             updated_at = NOW()`,
          [
            user.username, user.email, user.displayName, user.department, user.jobTitle, passwordHash,
            user.role ?? 'User', user.vehicleAdmin ?? false, user.mealAdmin ?? false, user.approverDoa ?? false,
            user.hasDepartment, user.hasJobTitle, user.hasRole, user.hasVehicleAdmin, user.hasMealAdmin, user.hasApproverDoa,
          ],
        );
        if (isExisting) updated += 1;
        else created += 1;
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      if (error?.code === '23505') throw new HttpError(409, 'A username or email already exists.');
      throw error;
    } finally {
      client.release();
    }

    await writeAudit(req.demoUser.email, 'user', 'csv-import', 'upsert', { created, updated });
    res.json({ created, updated });
  },
);

app.get('/api/admin-access', async (req, res) => {
  await requireRole(req, 'super_admin');
  const { rows } = await pool.query(
    `SELECT id, email, vehicle_admin, meal_admin FROM users
     WHERE vehicle_admin = TRUE OR meal_admin = TRUE OR role = 'SuperAdmin'
     ORDER BY email`,
  );
  res.json(rows.map(mapAdminAccess));
});

app.put('/api/admin-access/:email', async (req, res) => {
  await requireRole(req, 'super_admin');
  const email = String(req.params.email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Enter a valid email address.');
  const vehicleAdmin = Boolean(req.body.vehicleAdmin);
  const mealAdmin = Boolean(req.body.mealAdmin);
  const { rows: existingUsers } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  let rows;
  if (existingUsers[0]) {
    ({ rows } = await pool.query(
      `UPDATE users SET vehicle_admin = $2, meal_admin = $3, updated_at = NOW()
       WHERE email = $1
       RETURNING id, email, vehicle_admin, meal_admin`,
      [email, vehicleAdmin, mealAdmin],
    ));
  } else {
    const passwordHash = await hashPassword(DEFAULT_USER_PASSWORD);
    ({ rows } = await queryUserWrite(
      `INSERT INTO users (
         username, email, display_name, password_hash, must_change_password,
         role, vehicle_admin, meal_admin
       )
       VALUES ($1, $2, $2, $3, TRUE, 'User', $4, $5)
       RETURNING id, email, vehicle_admin, meal_admin`,
      [email, email, passwordHash, vehicleAdmin, mealAdmin],
    ));
  }
  await writeAudit(req.demoUser.email, 'admin_access', email, 'upsert', { vehicleAdmin, mealAdmin });
  res.json(mapAdminAccess(rows[0]));
});

app.delete('/api/admin-access/:id', async (req, res) => {
  await requireRole(req, 'super_admin');
  const id = parseId(req.params.id);
  const { rows } = await pool.query(
    `UPDATE users SET vehicle_admin = FALSE, meal_admin = FALSE, updated_at = NOW()
     WHERE id = $1 AND role <> 'SuperAdmin'
     RETURNING email`,
    [id],
  );
  if (!rows[0]) throw new HttpError(404, 'Admin access record was not found or cannot be revoked.');
  await writeAudit(req.demoUser.email, 'admin_access', rows[0].email, 'delete', {});
  res.status(204).end();
});

app.get('/api/meal-requests', async (req, res) => {
  const isAdmin = await hasRole(req, 'meal_admin');
  const values = isAdmin ? [] : [req.demoUser.email];
  const where = isAdmin ? '' : 'WHERE LOWER(requester_email) = LOWER($1)';
  const { rows } = await pool.query(
    `SELECT id, request_id, record_id, service_date::TEXT AS service_date, requester_name, requester_email,
       department, purpose, start_date::TEXT AS start_date, end_date::TEXT AS end_date, duration_hours, meal_category,
       quantity, additional, current_status, approval_trigger, created_at
     FROM meal_requests ${where} ORDER BY created_at DESC, service_date`,
    values,
  );
  res.json(rows.map(mapMealRequest));
});

app.post('/api/meal-requests', async (req, res) => {
  const records = req.body;
  if (!Array.isArray(records) || records.length === 0 || records.length > 100) {
    throw new HttpError(400, 'Submit between 1 and 100 service-date records.');
  }
  const connection = await pool.connect();
  try {
    await connection.query('BEGIN');
    const sequence = Number((await connection.query("SELECT nextval('meal_request_number_seq') AS value")).rows[0].value);
    const now = new Date();
    const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const requestId = `EMR-${datePart}-${String(sequence).padStart(2, '0')}`;
    const created = [];
    for (let index = 0; index < records.length; index += 1) {
      const request = records[index];
      if (String(request.requesterEmail ?? '').trim().toLowerCase() !== req.demoUser.email) {
        throw new HttpError(403, 'You can only submit requests for the selected demo user.');
      }
      const serviceDate = requireDate(request.serviceDate, 'serviceDate');
      const startDate = requireDate(request.startDate, 'startDate');
      const endDate = requireDate(request.endDate, 'endDate');
      const quantity = requirePositiveInteger(request.quantity, 'quantity');
      const values = [
        requestId,
        `${requestId}-${serviceDate.replaceAll('-', '')}`,
        serviceDate,
        requireString(request.requester, 'requester', 160),
        req.demoUser.email,
        requireString(request.department, 'department', 120),
        requireString(request.purpose, 'purpose', 500),
        startDate,
        endDate,
        request.durationHours == null ? null : requirePositiveNumber(request.durationHours, 'durationHours'),
        requireString(request.mealCategory, 'mealCategory', 120),
        quantity,
        String(request.additional ?? '').slice(0, 2000),
        index === 0,
      ];
      const result = await connection.query(
        `INSERT INTO meal_requests (
          request_id, record_id, service_date, requester_name, requester_email, department,
          purpose, start_date, end_date, duration_hours, meal_category, quantity, additional,
          approval_trigger
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        RETURNING id, request_id, record_id, service_date::TEXT AS service_date, requester_name, requester_email,
          department, purpose, start_date::TEXT AS start_date, end_date::TEXT AS end_date, duration_hours, meal_category,
          quantity, additional, current_status, approval_trigger, created_at`,
        values,
      );
      created.push(result.rows[0]);
    }
    await connection.query('COMMIT');
    await writeAudit(req.demoUser.email, 'meal_request', requestId, 'create_group', { recordCount: created.length });
    res.status(201).json(created.map(mapMealRequest));
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
});

app.patch('/api/meal-requests/:requestId/status', async (req, res) => {
  await requireRole(req, 'meal_admin');
  const status = requireString(req.body.status, 'status', 30);
  if (!['Submitted', 'Approved', 'Rejected', 'Cancelled'].includes(status)) throw new HttpError(400, 'Unsupported meal request status.');
  const { rows } = await pool.query(
    `UPDATE meal_requests SET current_status = $2 WHERE request_id = $1
     RETURNING id, request_id, record_id, service_date::TEXT AS service_date, requester_name, requester_email,
       department, purpose, start_date::TEXT AS start_date, end_date::TEXT AS end_date, duration_hours, meal_category,
       quantity, additional, current_status, approval_trigger, created_at`,
    [req.params.requestId, status],
  );
  if (rows.length === 0) throw new HttpError(404, 'Meal request group was not found.');
  await writeAudit(req.demoUser.email, 'meal_request', req.params.requestId, 'update_group_status', { status });
  res.json(rows.map(mapMealRequest));
});

app.patch('/api/meal-requests/:requestId/quantity', async (req, res) => {
  await requireRole(req, 'meal_admin');
  const recordId = requireString(req.body.recordId, 'recordId', 200);
  const quantity = requirePositiveInteger(req.body.quantity, 'quantity');
  const { rows } = await pool.query(
    `UPDATE meal_requests SET quantity = $3 WHERE request_id = $1 AND record_id = $2
     RETURNING id, request_id, record_id, service_date::TEXT AS service_date, requester_name, requester_email,
       department, purpose, start_date::TEXT AS start_date, end_date::TEXT AS end_date, duration_hours, meal_category,
       quantity, additional, current_status, approval_trigger, created_at`,
    [req.params.requestId, recordId, quantity],
  );
  if (!rows[0]) throw new HttpError(404, 'Meal service-date record was not found.');
  await writeAudit(req.demoUser.email, 'meal_request', recordId, 'update_quantity', { quantity });
  res.json(mapMealRequest(rows[0]));
});

app.post('/api/meal-requests/:requestId/cancel', async (req, res) => {
  await requireRole(req, 'meal_admin');
  const connection = await pool.connect();
  try {
    await connection.query('BEGIN');
    const { rows: current } = await connection.query(
      'SELECT current_status FROM meal_requests WHERE request_id = $1 FOR UPDATE',
      [req.params.requestId],
    );
    if (current.length === 0) throw new HttpError(404, 'Meal request group was not found.');
    if (current.some((record) => record.current_status !== 'Submitted')) {
      throw new HttpError(409, 'A request group can only be cancelled while every date is Submitted.');
    }
    const { rows } = await connection.query(
      `UPDATE meal_requests SET current_status = 'Cancelled' WHERE request_id = $1
       RETURNING id, request_id, record_id, service_date::TEXT AS service_date, requester_name, requester_email,
         department, purpose, start_date::TEXT AS start_date, end_date::TEXT AS end_date, duration_hours, meal_category,
         quantity, additional, current_status, approval_trigger, created_at`,
      [req.params.requestId],
    );
    await connection.query('COMMIT');
    await writeAudit(req.demoUser.email, 'meal_request', req.params.requestId, 'cancel_group', { recordCount: rows.length });
    res.json(rows.map(mapMealRequest));
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
});

app.delete('/api/meal-records/:id', async (req, res) => {
  await requireRole(req, 'meal_admin');
  const id = parseId(req.params.id);
  const { rows } = await pool.query('DELETE FROM meal_requests WHERE id = $1 RETURNING record_id', [id]);
  if (!rows[0]) throw new HttpError(404, 'Meal service-date record was not found.');
  await writeAudit(req.demoUser.email, 'meal_request', rows[0].record_id, 'delete_record', {});
  res.status(204).end();
});

app.get('/api/vehicle-requests', async (req, res) => {
  const isAdmin = await hasRole(req, 'vehicle_admin');
  const values = isAdmin ? [] : [req.demoUser.email];
  const where = isAdmin ? '' : 'WHERE LOWER(requester_email) = LOWER($1)';
  const { rows } = await pool.query(
    `SELECT ${vehicleColumns} FROM vehicle_requests ${where} ORDER BY created_at DESC, id DESC`,
    values,
  );
  res.json(rows.map(mapVehicleRequest));
});

app.post('/api/vehicle-requests', async (req, res) => {
  const request = req.body;
  if (String(request.emailPemohon ?? '').trim().toLowerCase() !== req.demoUser.email) {
    throw new HttpError(403, 'You can only submit requests for the selected demo user.');
  }
  const sequence = Number((await pool.query("SELECT nextval('vehicle_request_number_seq') AS value")).rows[0].value);
  const now = new Date();
  const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const requestNumber = `RQ${datePart}${String(sequence).padStart(4, '0')}`;
  const { rows } = await pool.query(
    `INSERT INTO vehicle_requests (
       request_number, requester_name, requester_email, department_key, pickup_date, pickup_time,
       pickup_point, destination_key, destination_other, purpose, requester_note, passenger_count
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING ${vehicleColumns}`,
    [
      requestNumber,
      requireString(request.namaPemohon, 'namaPemohon', 160),
      req.demoUser.email,
      requireString(request.departemenKey, 'departemenKey', 80),
      requireDate(request.tanggal, 'tanggal'),
      requireString(request.jam, 'jam', 10),
      requireString(request.titikJemput, 'titikJemput', 200),
      requireString(request.tujuanKey, 'tujuanKey', 80),
      request.tujuanLainnyaDet ? String(request.tujuanLainnyaDet).slice(0, 500) : null,
      requireString(request.keperluan, 'keperluan', 500),
      request.catatan ? String(request.catatan).slice(0, 2000) : null,
      requirePositiveInteger(request.jumlahPenumpang, 'jumlahPenumpang'),
    ],
  );
  await writeAudit(req.demoUser.email, 'vehicle_request', requestNumber, 'create', {});
  res.status(201).json(mapVehicleRequest(rows[0]));
});

app.patch('/api/vehicle-requests/:id', async (req, res) => {
  await requireRole(req, 'vehicle_admin');
  const id = parseId(req.params.id);
  const connection = await pool.connect();
  try {
    await connection.query('BEGIN');
    const { rows: found } = await connection.query('SELECT * FROM vehicle_requests WHERE id = $1 FOR UPDATE', [id]);
    const current = found[0];
    if (!current) throw new HttpError(404, 'Vehicle request was not found.');
    if (['Approved', 'RejectedVehicleNotAvailable', 'RejectedPlantDirector', 'Cancelled'].includes(current.current_status_key)) {
      throw new HttpError(409, 'Final vehicle requests cannot be changed.');
    }
    const body = req.body;
    const changes = [];
    const values = [];
    const fields = {
      tanggal: ['pickup_date', (value) => requireDate(value, 'tanggal')],
      jam: ['pickup_time', (value) => requireString(value, 'jam', 10)],
      tujuanKey: ['destination_key', (value) => requireString(value, 'tujuanKey', 80)],
      tujuanLainnyaDet: ['destination_other', (value) => value == null ? null : String(value).slice(0, 500)],
      jumlahPenumpang: ['passenger_count', (value) => requirePositiveInteger(value, 'jumlahPenumpang')],
      titikJemput: ['pickup_point', (value) => requireString(value, 'titikJemput', 200)],
      keperluan: ['purpose', (value) => requireString(value, 'keperluan', 500)],
      adminNote: ['admin_note', (value) => value == null ? null : String(value).slice(0, 2000)],
      plantDirectorNote: ['director_note', (value) => value == null ? null : String(value).slice(0, 2000)],
    };
    for (const [key, [column, parse]] of Object.entries(fields)) {
      if (Object.hasOwn(body, key)) {
        values.push(parse(body[key]));
        changes.push(`${column} = $${values.length}`);
      }
    }
    let adminDecision = current.admin_decision_key;
    let directorDecision = current.director_decision_key;
    let status = current.current_status_key;
    if (Object.hasOwn(body, 'adminDecisionKey')) {
      if (current.current_status_key !== 'Submitted' || current.admin_decision_key) {
        throw new HttpError(409, 'The vehicle availability decision has already been made.');
      }
      adminDecision = body.adminDecisionKey;
      if (!['Available', 'NotAvailable'].includes(adminDecision)) throw new HttpError(400, 'Choose Available or Not Available.');
      values.push(adminDecision);
      changes.push(`admin_decision_key = $${values.length}`);
    }
    if (Object.hasOwn(body, 'plantDirectorDecisionKey')) {
      if (current.current_status_key !== 'PendingPlantDirectorApproval' || adminDecision !== 'Available' || current.director_decision_key) {
        throw new HttpError(409, 'Plant Director approval is not available at this stage.');
      }
      directorDecision = body.plantDirectorDecisionKey;
      if (!['Approved', 'Rejected'].includes(directorDecision)) throw new HttpError(400, 'Choose Approved or Rejected.');
      values.push(directorDecision);
      changes.push(`director_decision_key = $${values.length}`);
    }
    if (body.currentStatusKey === 'Cancelled') {
      if (current.current_status_key !== 'Submitted' || adminDecision) throw new HttpError(409, 'Only unreviewed Submitted requests can be cancelled.');
      status = 'Cancelled';
    } else {
      status = adminDecision === 'NotAvailable'
        ? 'RejectedVehicleNotAvailable'
        : directorDecision === 'Approved'
          ? 'Approved'
          : directorDecision === 'Rejected'
            ? 'RejectedPlantDirector'
            : adminDecision === 'Available'
              ? 'PendingPlantDirectorApproval'
              : current.current_status_key;
    }
    values.push(status);
    changes.push(`current_status_key = $${values.length}`);
    changes.push('last_update = NOW()');
    values.push(id);
    const { rows } = await connection.query(
      `UPDATE vehicle_requests SET ${changes.join(', ')} WHERE id = $${values.length} RETURNING ${vehicleColumns}`,
      values,
    );
    await connection.query('COMMIT');
    await writeAudit(req.demoUser.email, 'vehicle_request', current.request_number, 'update', body);
    res.json(mapVehicleRequest(rows[0]));
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
});

app.delete('/api/vehicle-requests/:id', async (req, res) => {
  await requireRole(req, 'vehicle_admin');
  const id = parseId(req.params.id);
  const { rows } = await pool.query('DELETE FROM vehicle_requests WHERE id = $1 RETURNING request_number', [id]);
  if (!rows[0]) throw new HttpError(404, 'Vehicle request was not found.');
  await writeAudit(req.demoUser.email, 'vehicle_request', rows[0].request_number, 'delete', {});
  res.status(204).end();
});

app.use((error, _req, res, _next) => {
  const status = error instanceof HttpError ? error.status : 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: status === 500 ? 'The request could not be completed.' : error.message });
});

function readUserInput(body, includeEmail) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'User details are required.');
  }
  const username = requireString(body.username, 'username', 100);
  const displayName = requireString(body.displayName, 'displayName', 200);
  const department = optionalString(body.department, 'department', 150);
  const jobTitle = optionalString(body.jobTitle, 'jobTitle', 150);
  const role = requireString(body.role ?? 'User', 'role', 30);
  if (!validUserRoles.has(role)) throw new HttpError(400, 'Role must be User, ITAdmin, or SuperAdmin.');
  const user = {
    username,
    displayName,
    department,
    jobTitle,
    role,
    vehicleAdmin: requireBoolean(body.vehicleAdmin, 'vehicleAdmin'),
    mealAdmin: requireBoolean(body.mealAdmin, 'mealAdmin'),
    approverDoa: requireBoolean(body.approverDoa, 'approverDoa'),
  };
  if (includeEmail) {
    const email = requireString(body.email, 'email', 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Enter a valid email address.');
    user.email = email;
  }
  return user;
}

function validateImportedUser(user) {
  const label = `CSV row ${user.rowNumber}`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    throw new HttpError(400, `${label} must contain a valid email address.`);
  }
  const username = requireString(user.username, `${label} username`, 100);
  const displayName = requireString(user.displayName, `${label} display name`, 200);
  const role = user.role || 'User';
  if (!validUserRoles.has(role)) throw new HttpError(400, `${label} has an unsupported role.`);
  return {
    ...user,
    username,
    email: user.email.toLowerCase(),
    displayName,
    department: user.hasDepartment ? optionalString(user.department, `${label} department`, 150) : null,
    jobTitle: user.hasJobTitle ? optionalString(user.jobTitle, `${label} job title`, 150) : null,
    role,
    vehicleAdmin: user.hasVehicleAdmin ? parseCsvBoolean(user.vehicleAdmin, label) : undefined,
    mealAdmin: user.hasMealAdmin ? parseCsvBoolean(user.mealAdmin, label) : undefined,
    approverDoa: user.hasApproverDoa ? parseCsvBoolean(user.approverDoa, label) : undefined,
  };
}

function parseCsvBoolean(value, label) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === '') return undefined;
  if (['true', 'yes', '1'].includes(normalized)) return true;
  if (['false', 'no', '0'].includes(normalized)) return false;
  throw new HttpError(400, `${label} contains an invalid permission value.`);
}

function optionalString(value, field, maxLength) {
  const normalized = String(value ?? '').trim();
  if (normalized.length > maxLength) throw new HttpError(400, `${field} must be at most ${maxLength} characters.`);
  return normalized || null;
}

function requireBoolean(value, field) {
  if (typeof value !== 'boolean') throw new HttpError(400, `${field} must be true or false.`);
  return value;
}

async function queryUserWrite(query, values) {
  try {
    return await pool.query(query, values);
  } catch (error) {
    if (error?.code === '23505') throw new HttpError(409, 'A user with this email or username already exists.');
    throw error;
  }
}

function requireString(value, field, maxLength) {
  const normalized = String(value ?? '').trim();
  if (!normalized || normalized.length > maxLength) throw new HttpError(400, `${field} is required and must be at most ${maxLength} characters.`);
  return normalized;
}

function requireDate(value, field) {
  const date = String(value ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    throw new HttpError(400, `${field} must be a date in YYYY-MM-DD format.`);
  }
  return date;
}

function requirePositiveInteger(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new HttpError(400, `${field} must be a positive whole number.`);
  return number;
}

function requirePositiveNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new HttpError(400, `${field} must be greater than zero.`);
  return number;
}

function parseId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new HttpError(400, 'Record ID is invalid.');
  return id;
}

async function hasRole(req, role) {
  const { rows } = await pool.query(
    `SELECT role, vehicle_admin, meal_admin FROM users WHERE email = $1 AND is_active = TRUE`,
    [req.demoUser.email],
  );
  const user = rows[0];
  if (!user) return false;
  if (role === 'super_admin') return user.role === 'SuperAdmin';
  if (role === 'vehicle_admin') return Boolean(user.vehicle_admin);
  if (role === 'meal_admin') return Boolean(user.meal_admin);
  throw new Error(`Unknown permission key: ${role}`);
}

async function requireRole(req, role) {
  if (!await hasRole(req, role)) throw new HttpError(403, 'You do not have permission to perform this action.');
}

async function requireUserAdmin(req) {
  const { rows } = await pool.query(
    'SELECT role FROM users WHERE email = $1 AND is_active = TRUE',
    [req.demoUser.email],
  );
  const role = rows[0]?.role;
  if (role !== 'ITAdmin' && role !== 'SuperAdmin') {
    throw new HttpError(403, 'ITAdmin or SuperAdmin role is required.');
  }
  return role;
}

async function writeAudit(actorEmail, entityType, entityId, action, details) {
  await pool.query(
    'INSERT INTO audit_log (actor_email, entity_type, entity_id, action, details) VALUES ($1, $2, $3, $4, $5)',
    [actorEmail, entityType, String(entityId), action, JSON.stringify(details)],
  );
}

function mapAdminAccess(row) {
  return {
    id: Number(row.id),
    title: row.email,
    vehicleAdmin: row.vehicle_admin ? 'Yes' : 'No',
    mealAdmin: row.meal_admin ? 'Yes' : 'No',
  };
}

function mapManagedUser(row) {
  return {
    id: Number(row.id),
    username: row.username,
    email: row.email,
    displayName: row.display_name,
    department: row.department,
    jobTitle: row.job_title,
    isActive: row.is_active,
    mustChangePassword: row.must_change_password,
    role: row.role,
    vehicleAdmin: row.vehicle_admin,
    mealAdmin: row.meal_admin,
    approverDoa: row.approver_doa,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLogin: row.last_login,
  };
}

async function getManagedUser(id) {
  const { rows } = await pool.query(
    `SELECT ${managedUserColumns} FROM users WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

async function requireAnotherSuperAdmin(excludedId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::INTEGER AS count FROM users
     WHERE role = 'SuperAdmin' AND is_active = TRUE AND id <> $1`,
    [excludedId],
  );
  if (rows[0].count < 1) throw new HttpError(409, 'At least one active SuperAdmin must remain.');
}

async function migrateAdminAccess() {
  const { rows: accessRows } = await pool.query(
    'SELECT email, vehicle_admin, meal_admin, super_admin FROM admin_access ORDER BY id',
  );
  const legacyUsers = new Map(demoUsers.map((user) => [user.email, {
    email: user.email,
    vehicle_admin: false,
    meal_admin: false,
    super_admin: false,
  }]));
  for (const row of accessRows) legacyUsers.set(row.email, row);
  const usersToMigrate = [...legacyUsers.values()];

  const { rows: existingRows } = await pool.query(
    'SELECT email FROM users WHERE email = ANY($1::TEXT[])',
    [usersToMigrate.map((row) => row.email)],
  );
  const existingEmails = new Set(existingRows.map((row) => row.email));
  const missingRows = usersToMigrate.filter((row) => !existingEmails.has(row.email));
  if (missingRows.length === 0) return;

  const names = new Map(demoUsers.map((user) => [user.email, user]));
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const row of missingRows) {
      const email = row.email.toLowerCase();
      const knownUser = names.get(email);
      const passwordHash = await hashPassword(DEFAULT_USER_PASSWORD);
      await client.query(
        `INSERT INTO users (
           username, email, display_name, job_title, password_hash,
           is_active, must_change_password, role, vehicle_admin, meal_admin, approver_doa
         )
         VALUES ($1, $2, $3, $4, $5, TRUE, TRUE, $6, $7, $8, $9)
         ON CONFLICT (email) DO NOTHING`,
        [
          email,
          email,
          knownUser?.fullName ?? email,
          knownUser?.jobTitle ?? null,
          passwordHash,
          row.super_admin ? 'SuperAdmin' : 'User',
          row.vehicle_admin,
          row.meal_admin,
          row.super_admin,
        ],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function mapMealRequest(row) {
  return {
    sharePointId: Number(row.id),
    id: row.request_id,
    recordId: row.record_id,
    serviceDate: row.service_date,
    requester: row.requester_name,
    requesterEmail: row.requester_email,
    department: row.department,
    purpose: row.purpose,
    startDate: row.start_date,
    endDate: row.end_date,
    durationHours: row.duration_hours == null ? undefined : Number(row.duration_hours),
    mealCategory: row.meal_category,
    quantity: row.quantity,
    additional: row.additional,
    status: row.current_status,
    createdAt: row.created_at,
    approvalTrigger: row.approval_trigger,
  };
}

function mapVehicleRequest(row) {
  return {
    id: Number(row.id),
    title: row.request_number,
    adminDecisionKey: row.admin_decision_key ?? undefined,
    adminNote: row.admin_note ?? undefined,
    catatan: row.requester_note ?? undefined,
    created: row.created_at,
    createdDate: row.created_at,
    currentStatusKey: row.current_status_key,
    departemenKey: row.department_key,
    emailPemohon: row.requester_email,
    jam: row.pickup_time,
    jumlahPenumpang: String(row.passenger_count),
    keperluan: row.purpose,
    lastUpdate: row.last_update,
    namaPemohon: row.requester_name,
    plantDirectorDecisionKey: row.director_decision_key ?? undefined,
    plantDirectorNote: row.director_note ?? undefined,
    tanggal: row.pickup_date,
    titikJemput: row.pickup_point,
    tujuanKey: row.destination_key,
    tujuanLainnyaDet: row.destination_other ?? undefined,
  };
}

const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
await pool.query(schema);
await migrateAdminAccess();
await pool.query('SELECT 1');
createServer(app).listen(port, '127.0.0.1', () => {
  console.log(`IAI Request Center API listening on http://localhost:${port}`);
});

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});
