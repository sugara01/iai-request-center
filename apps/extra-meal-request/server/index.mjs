import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import express from 'express';
import pg from 'pg';
import {
  CsvImportError,
  DEFAULT_USER_PASSWORD,
  hashPassword,
  isPasswordPolicySatisfied,
  parseUserCsv,
  verifyPassword,
} from './user-management.mjs';
import {
  clearSessionCookie,
  createAuthMiddleware,
  createSessionToken,
  SESSION_TTL_MS,
  setSessionCookie,
} from './auth.mjs';
import { mapInboxApproval, mapUserNotification, mealGroupHasPendingApproval } from './inbox.mjs';

const { Pool } = pg;
const port = Number(process.env.API_PORT ?? 3001);
const validUserRoles = new Set(['User', 'ITAdmin', 'SuperAdmin']);
const managedUserColumns = `id, username, email, display_name, department, job_title,
  is_active, must_change_password, role, vehicle_admin, meal_admin, approver_doa,
  created_at, updated_at, last_login`;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://iai_app:local-dev-only@localhost:5434/iai_request_center',
});
const dummyPasswordHash = await hashPassword('invalid-login-placeholder');
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

const loginFailures = new Map();
const loginWindowMs = 15 * 60 * 1000;
const maxLoginFailures = 5;

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || email.length > 254 || !password || password.length > 1024) {
    throw new HttpError(400, 'Email and password are required.');
  }
  const attemptKey = `${req.ip}:${email}`;
  const attempts = loginFailures.get(attemptKey) ?? [];
  const recentAttempts = attempts.filter((timestamp) => Date.now() - timestamp < loginWindowMs);
  if (recentAttempts.length >= maxLoginFailures) {
    loginFailures.set(attemptKey, recentAttempts);
    throw new HttpError(429, 'Too many sign-in attempts. Try again in 15 minutes.');
  }

  const { rows } = await pool.query(
    `SELECT id, username, email, display_name, department, job_title, password_hash,
            is_active, must_change_password, role, vehicle_admin, meal_admin, approver_doa
     FROM users WHERE LOWER(email) = $1`,
    [email],
  );
  const user = rows[0];
  const passwordMatches = await verifyPassword(password, user?.password_hash ?? dummyPasswordHash);
  if (!user || !user.is_active || !passwordMatches) {
    recentAttempts.push(Date.now());
    loginFailures.set(attemptKey, recentAttempts);
    if (loginFailures.size > 10_000) {
      for (const [key, timestamps] of loginFailures) {
        if (timestamps.every((timestamp) => Date.now() - timestamp >= loginWindowMs)) loginFailures.delete(key);
      }
    }
    throw new HttpError(401, 'Email or password is incorrect.');
  }

  loginFailures.delete(attemptKey);
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE users SET last_login = NOW(), login_count = login_count + 1 WHERE id = $1',
      [user.id],
    );
    await client.query(
      'INSERT INTO auth_sessions (id, user_id, expires_at) VALUES ($1, $2, $3)',
      [sessionId, user.id, expiresAt],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  const token = await createSessionToken(user.id, sessionId);
  setSessionCookie(res, token);
  res.json(mapAppUser(user));
});

app.use('/api', createAuthMiddleware(pool));

app.post('/api/auth/logout', async (req, res) => {
  await pool.query('UPDATE auth_sessions SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL', [req.user.sessionId]);
  clearSessionCookie(res);
  res.json({ message: 'Signed out.' });
});

app.get('/api/session', async (req, res) => {
  res.json(mapAppUser(req.user));
});

app.get('/api/inbox/approvals', async (req, res) => {
  const { rows: users } = await pool.query(
    'SELECT vehicle_admin, meal_admin FROM users WHERE id = $1 AND is_active = TRUE',
    [req.user.id],
  );
  const user = users[0];
  if (!user || (!user.vehicle_admin && !user.meal_admin)) {
    throw new HttpError(403, 'Vehicle Admin or Extra Meal Admin permission is required.');
  }

  const { rows } = await pool.query(
    `SELECT 'vehicle' AS request_type, request_number AS request_id, requester_name,
            created_at AS request_date, current_status_key AS current_status, id AS vehicle_id
     FROM vehicle_requests
     WHERE $1::BOOLEAN
       AND current_status_key IN ('Submitted', 'PendingPlantDirectorApproval')
     UNION ALL
     SELECT 'meal' AS request_type, request_id, MIN(requester_name) AS requester_name,
            MIN(created_at) AS request_date,
            CASE WHEN COUNT(DISTINCT current_status) = 1 THEN MIN(current_status) ELSE 'Mixed' END AS current_status,
            NULL::BIGINT AS vehicle_id
     FROM meal_requests
     WHERE $2::BOOLEAN
     GROUP BY request_id
     HAVING BOOL_OR(current_status = 'Submitted')
     ORDER BY request_date ASC, request_id ASC`,
    [Boolean(user.vehicle_admin), Boolean(user.meal_admin)],
  );
  res.json(rows.map(mapInboxApproval));
});

app.get('/api/notifications', async (req, res) => {
  const page = Math.max(1, Math.min(10000, Number.parseInt(String(req.query.page ?? '1'), 10) || 1));
  const pageSize = Math.max(1, Math.min(100, Number.parseInt(String(req.query.pageSize ?? '10'), 10) || 10));
  const status = String(req.query.status ?? 'all');
  const type = String(req.query.type ?? 'all');
  if (!['all', 'unread', 'read'].includes(status)) throw new HttpError(400, 'Unsupported notification status filter.');
  if (!['all', 'vehicle', 'meal', 'system'].includes(type)) throw new HttpError(400, 'Unsupported notification type filter.');

  const conditions = ['user_id = $1'];
  const values = [req.user.id];
  if (status === 'unread') conditions.push('read_at IS NULL');
  if (status === 'read') conditions.push('read_at IS NOT NULL');
  if (type === 'vehicle') {
    values.push('vehicle_request');
    conditions.push(`related_entity_type = $${values.length}`);
  } else if (type === 'meal') {
    values.push('meal_request');
    conditions.push(`related_entity_type = $${values.length}`);
  } else if (type === 'system') {
    conditions.push("event_type IN ('password_changed', 'password_reset')");
  }
  const where = conditions.join(' AND ');
  const countResult = await pool.query(
    `SELECT COUNT(*)::INTEGER AS total FROM user_notifications WHERE ${where}`,
    values,
  );
  const total = countResult.rows[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * pageSize;
  values.push(pageSize, offset);
  const [unreadResult, rowsResult] = await Promise.all([
    pool.query('SELECT COUNT(*)::INTEGER AS unread_count FROM user_notifications WHERE user_id = $1 AND read_at IS NULL', [req.user.id]),
    pool.query(
      `SELECT id, event_type, related_entity_type, related_entity_id, created_at, read_at
       FROM user_notifications
       WHERE ${where}
       ORDER BY created_at DESC, id DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    ),
  ]);
  res.json({
    items: rowsResult.rows.map(mapUserNotification),
    unreadCount: Number(unreadResult.rows[0]?.unread_count ?? 0),
    page: currentPage,
    pageSize,
    total,
    totalPages,
  });
});

app.post('/api/notifications/read-all', async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE user_notifications SET read_at = NOW()
     WHERE user_id = $1 AND read_at IS NULL
     RETURNING id`,
    [req.user.id],
  );
  res.json({ updated: rows.length });
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  const id = parseId(req.params.id);
  const { rows } = await pool.query(
    `UPDATE user_notifications SET read_at = COALESCE(read_at, NOW())
     WHERE id = $1 AND user_id = $2
     RETURNING id, read_at`,
    [id, req.user.id],
  );
  if (!rows[0]) throw new HttpError(404, 'Notification was not found.');
  res.json({ id: Number(rows[0].id), readAt: rows[0].read_at });
});

app.delete('/api/notifications/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const { rows } = await pool.query(
    'DELETE FROM user_notifications WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, req.user.id],
  );
  if (!rows[0]) throw new HttpError(404, 'Notification was not found.');
  res.json({ deleted: 1 });
});

app.post('/api/notifications/read-selected', async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((id) => Number(id)).filter((id) => Number.isSafeInteger(id) && id > 0)
    : [];
  if (ids.length === 0) throw new HttpError(400, 'Select at least one notification.');
  const { rows } = await pool.query(
    `UPDATE user_notifications SET read_at = COALESCE(read_at, NOW())
     WHERE user_id = $1 AND id = ANY($2::BIGINT[]) AND read_at IS NULL
     RETURNING id`,
    [req.user.id, ids],
  );
  res.json({ updated: rows.length });
});

app.post('/api/notifications/delete-selected', async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((id) => Number(id)).filter((id) => Number.isSafeInteger(id) && id > 0)
    : [];
  if (ids.length === 0) throw new HttpError(400, 'Select at least one notification.');
  const { rows } = await pool.query(
    'DELETE FROM user_notifications WHERE user_id = $1 AND id = ANY($2::BIGINT[]) RETURNING id',
    [req.user.id, ids],
  );
  res.json({ deleted: rows.length });
});

app.get('/api/profile', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT username, email, display_name, department, job_title, role,
            vehicle_admin, meal_admin, approver_doa, is_active, must_change_password,
            created_at, last_login, password_changed_at, login_count
     FROM users WHERE id = $1`,
    [req.user.id],
  );
  res.json(mapUserProfile(rows[0]));
});

app.patch('/api/profile', async (req, res) => {
  const displayName = requireString(req.body?.displayName, 'Display name', 150);
  const department = optionalString(req.body?.department, 'Department', 100);
  const jobTitle = optionalString(req.body?.jobTitle, 'Job title', 150);
  const { rows } = await pool.query(
    `UPDATE users SET display_name = $2, department = $3, job_title = $4, updated_at = NOW()
     WHERE id = $1
     RETURNING username, email, display_name, department, job_title, role,
               vehicle_admin, meal_admin, approver_doa, is_active, must_change_password,
               created_at, last_login, password_changed_at, login_count`,
    [req.user.id, displayName, department, jobTitle],
  );
  await writeAudit(req.user.email, 'user', req.user.email, 'update_profile', {});
  res.json(mapUserProfile(rows[0]));
});

app.post('/api/auth/change-password', async (req, res) => {
  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
  if (!currentPassword) throw new HttpError(400, 'Current password is required.');
  if (!isPasswordPolicySatisfied(newPassword)) {
    throw new HttpError(400, 'New password must be 8 to 128 characters and include an uppercase letter, a lowercase letter, and a number.');
  }
  if (currentPassword === newPassword) {
    throw new HttpError(400, 'Your new password must be different from your current password.');
  }
  const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  if (!await verifyPassword(currentPassword, rows[0].password_hash)) {
    throw new HttpError(400, 'Current password is incorrect.');
  }
  const passwordHash = await hashPassword(newPassword);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE users
       SET password_hash = $2, must_change_password = FALSE,
           password_changed_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [req.user.id, passwordHash],
    );
    await client.query(
      'UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND id <> $2 AND revoked_at IS NULL',
      [req.user.id, req.user.sessionId],
    );
    await insertUserNotification(client, req.user.email, 'password_changed', 'user', req.user.email);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  await writeAudit(req.user.email, 'user', req.user.email, 'change_password', {});
  res.json({ message: 'Password changed successfully.' });
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
       is_active, must_change_password, role, vehicle_admin, meal_admin, approver_doa,
       password_changed_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, TRUE, TRUE, $7, $8, $9, $10, NOW())
     RETURNING ${managedUserColumns}`,
    [
      user.username, user.email, user.displayName, user.department, user.jobTitle, passwordHash,
      user.role, user.vehicleAdmin, user.mealAdmin, user.approverDoa,
    ],
  );
  await writeAudit(req.user.email, 'user', user.email, 'create', { role: user.role });
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
         must_change_password = COALESCE($10, must_change_password),
         updated_at = NOW()
     WHERE id = $1
     RETURNING ${managedUserColumns}`,
    [
      id, user.username, user.displayName, user.department, user.jobTitle,
      user.role, user.vehicleAdmin, user.mealAdmin, user.approverDoa, user.mustChangePassword ?? null,
    ],
  );
  await writeAudit(req.user.email, 'user', rows[0].email, 'update', {
    role: user.role,
    vehicleAdmin: user.vehicleAdmin,
    mealAdmin: user.mealAdmin,
    approverDoa: user.approverDoa,
    mustChangePassword: user.mustChangePassword,
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
  if (!isActive && current.email === req.user.email) {
    throw new HttpError(400, 'You cannot disable the account currently administering users.');
  }
  if (!isActive && current.role === 'SuperAdmin') await requireAnotherSuperAdmin(id);

  const { rows } = await pool.query(
    `UPDATE users SET is_active = $2, updated_at = NOW()
     WHERE id = $1 RETURNING ${managedUserColumns}`,
    [id, isActive],
  );
  if (!isActive) {
    await pool.query(
      'UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [id],
    );
  }
  await writeAudit(req.user.email, 'user', rows[0].email, isActive ? 'enable' : 'disable', {});
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
  const client = await pool.connect();
  let email;
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE users SET password_hash = $2, must_change_password = TRUE,
                        password_changed_at = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING email`,
      [id, passwordHash],
    );
    email = rows[0].email;
    await client.query(
      'UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [id],
    );
    await insertUserNotification(client, email, 'password_reset', 'user', email);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  await writeAudit(req.user.email, 'user', email, 'reset_password', {});
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
             is_active, must_change_password, role, vehicle_admin, meal_admin, approver_doa,
             password_changed_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, TRUE, TRUE, $7, $8, $9, $10, NOW())
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

    await writeAudit(req.user.email, 'user', 'csv-import', 'upsert', { created, updated });
    res.json({ created, updated });
  },
);

app.get('/api/meal-requests', async (req, res) => {
  const isAdmin = await hasRole(req, 'meal_admin');
  const values = isAdmin ? [] : [req.user.email];
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
      if (String(request.requesterEmail ?? '').trim().toLowerCase() !== req.user.email) {
        throw new HttpError(403, 'You can only submit requests for your own account.');
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
        req.user.email,
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
    await insertUserNotification(connection, req.user.email, 'request_submitted', 'meal_request', requestId);
    await insertRoleNotifications(connection, {
      eventType: 'request_assigned',
      relatedEntityType: 'meal_request',
      relatedEntityId: requestId,
      mealAdmin: true,
    });
    await connection.query('COMMIT');
    await writeAudit(req.user.email, 'meal_request', requestId, 'create_group', { recordCount: created.length });
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
  const connection = await pool.connect();
  let rows;
  try {
    await connection.query('BEGIN');
    const { rows: current } = await connection.query(
      'SELECT requester_email, current_status FROM meal_requests WHERE request_id = $1 FOR UPDATE',
      [req.params.requestId],
    );
    if (current.length === 0) throw new HttpError(404, 'Meal request group was not found.');
    if (req.body.requirePending === true && !mealGroupHasPendingApproval(current)) {
      throw new HttpError(409, 'This Extra Meal request no longer requires approval.');
    }
    const statusChanged = current.some((record) => record.current_status !== status);
    ({ rows } = await connection.query(
      `UPDATE meal_requests SET current_status = $2 WHERE request_id = $1
       RETURNING id, request_id, record_id, service_date::TEXT AS service_date, requester_name, requester_email,
         department, purpose, start_date::TEXT AS start_date, end_date::TEXT AS end_date, duration_hours, meal_category,
         quantity, additional, current_status, approval_trigger, created_at`,
      [req.params.requestId, status],
    ));
    if (statusChanged && ['Approved', 'Rejected'].includes(status)) {
      await insertUserNotification(
        connection,
        current[0].requester_email,
        status === 'Approved' ? 'request_approved' : 'request_rejected',
        'meal_request',
        req.params.requestId,
      );
      await insertRoleNotifications(connection, {
        eventType: status === 'Approved' ? 'request_approved' : 'request_rejected',
        relatedEntityType: 'meal_request',
        relatedEntityId: req.params.requestId,
        mealAdmin: true,
        excludeUserId: req.user.id,
        excludeEmail: current[0].requester_email,
      });
    }
    await connection.query('COMMIT');
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
  await writeAudit(req.user.email, 'meal_request', req.params.requestId, 'update_group_status', { status });
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
  await writeAudit(req.user.email, 'meal_request', recordId, 'update_quantity', { quantity });
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
    await writeAudit(req.user.email, 'meal_request', req.params.requestId, 'cancel_group', { recordCount: rows.length });
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
  await writeAudit(req.user.email, 'meal_request', rows[0].record_id, 'delete_record', {});
  res.status(204).end();
});

app.get('/api/vehicle-requests', async (req, res) => {
  const isAdmin = await hasRole(req, 'vehicle_admin');
  const values = isAdmin ? [] : [req.user.email];
  const where = isAdmin ? '' : 'WHERE LOWER(requester_email) = LOWER($1)';
  const { rows } = await pool.query(
    `SELECT ${vehicleColumns} FROM vehicle_requests ${where} ORDER BY created_at DESC, id DESC`,
    values,
  );
  res.json(rows.map(mapVehicleRequest));
});

app.post('/api/vehicle-requests', async (req, res) => {
  const request = req.body;
  if (String(request.emailPemohon ?? '').trim().toLowerCase() !== req.user.email) {
    throw new HttpError(403, 'You can only submit requests for your own account.');
  }
  const connection = await pool.connect();
  let requestNumber;
  let created;
  try {
    await connection.query('BEGIN');
    const sequence = Number((await connection.query("SELECT nextval('vehicle_request_number_seq') AS value")).rows[0].value);
    const now = new Date();
    const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    requestNumber = `RQ${datePart}${String(sequence).padStart(4, '0')}`;
    const { rows } = await connection.query(
      `INSERT INTO vehicle_requests (
         request_number, requester_name, requester_email, department_key, pickup_date, pickup_time,
         pickup_point, destination_key, destination_other, purpose, requester_note, passenger_count
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING ${vehicleColumns}`,
      [
        requestNumber,
        requireString(request.namaPemohon, 'namaPemohon', 160),
        req.user.email,
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
    created = rows[0];
    await insertUserNotification(connection, req.user.email, 'request_submitted', 'vehicle_request', requestNumber);
    await insertRoleNotifications(connection, {
      eventType: 'request_assigned',
      relatedEntityType: 'vehicle_request',
      relatedEntityId: requestNumber,
      vehicleAdmin: true,
    });
    await connection.query('COMMIT');
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
  await writeAudit(req.user.email, 'vehicle_request', requestNumber, 'create', {});
  res.status(201).json(mapVehicleRequest(created));
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
    if (status !== current.current_status_key) {
      if (status === 'Approved') {
        await insertUserNotification(connection, current.requester_email, 'request_approved', 'vehicle_request', current.request_number);
        await insertRoleNotifications(connection, {
          eventType: 'request_approved',
          relatedEntityType: 'vehicle_request',
          relatedEntityId: current.request_number,
          vehicleAdmin: true,
          excludeUserId: req.user.id,
          excludeEmail: current.requester_email,
        });
      } else if (['RejectedVehicleNotAvailable', 'RejectedPlantDirector'].includes(status)) {
        await insertUserNotification(connection, current.requester_email, 'request_rejected', 'vehicle_request', current.request_number);
        await insertRoleNotifications(connection, {
          eventType: 'request_rejected',
          relatedEntityType: 'vehicle_request',
          relatedEntityId: current.request_number,
          vehicleAdmin: true,
          excludeUserId: req.user.id,
          excludeEmail: current.requester_email,
        });
      }
    }
    await connection.query('COMMIT');
    await writeAudit(req.user.email, 'vehicle_request', current.request_number, 'update', body);
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
  await writeAudit(req.user.email, 'vehicle_request', rows[0].request_number, 'delete', {});
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
    mustChangePassword: body.mustChangePassword === undefined
      ? undefined
      : requireBoolean(body.mustChangePassword, 'mustChangePassword'),
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
    [req.user.email],
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
    [req.user.email],
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

async function insertRoleNotifications(client, {
  eventType,
  relatedEntityType,
  relatedEntityId,
  vehicleAdmin = false,
  mealAdmin = false,
  excludeUserId = null,
  excludeEmail = null,
}) {
  await client.query(
    `INSERT INTO user_notifications (user_id, event_type, related_entity_type, related_entity_id)
     SELECT id, $1, $2, $3 FROM users
     WHERE is_active = TRUE
       AND (($4::BOOLEAN AND vehicle_admin = TRUE) OR ($5::BOOLEAN AND meal_admin = TRUE))
       AND ($6::BIGINT IS NULL OR id <> $6)
       AND ($7::TEXT IS NULL OR LOWER(email) <> LOWER($7))`,
    [eventType, relatedEntityType, relatedEntityId, vehicleAdmin, mealAdmin, excludeUserId, excludeEmail],
  );
}

async function insertUserNotification(client, email, eventType, relatedEntityType, relatedEntityId) {
  await client.query(
    `INSERT INTO user_notifications (user_id, event_type, related_entity_type, related_entity_id)
     SELECT id, $2, $3, $4 FROM users WHERE LOWER(email) = LOWER($1)`,
    [email, eventType, relatedEntityType, relatedEntityId],
  );
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

function mapAppUser(user) {
  const role = user.role ?? 'User';
  return {
    userPrincipalName: user.email,
    email: user.email,
    fullName: user.display_name ?? user.displayName,
    department: user.department ?? null,
    jobTitle: user.job_title ?? user.jobTitle ?? null,
    role,
    isITAdmin: role === 'ITAdmin',
    isVehicleAdmin: Boolean(user.vehicle_admin ?? user.vehicleAdmin),
    isMealAdmin: Boolean(user.meal_admin ?? user.mealAdmin),
    isSuperAdmin: role === 'SuperAdmin',
    isApproverDoa: Boolean(user.approver_doa ?? user.approverDoa),
    mustChangePassword: Boolean(user.must_change_password ?? user.mustChangePassword),
  };
}

function mapUserProfile(row) {
  return {
    username: row.username,
    email: row.email,
    displayName: row.display_name,
    department: row.department,
    jobTitle: row.job_title,
    role: row.role,
    isVehicleAdmin: row.vehicle_admin,
    isMealAdmin: row.meal_admin,
    isApproverDoa: row.approver_doa,
    isActive: row.is_active,
    mustChangePassword: row.must_change_password,
    createdAt: row.created_at,
    lastLogin: row.last_login,
    passwordChangedAt: row.password_changed_at,
    loginCount: Number(row.login_count ?? 0),
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

  const { rows: existingRows } = await pool.query(
    'SELECT email FROM users WHERE email = ANY($1::TEXT[])',
    [accessRows.map((row) => row.email)],
  );
  const existingEmails = new Set(existingRows.map((row) => row.email));
  const missingRows = accessRows.filter((row) => !existingEmails.has(row.email));
  if (missingRows.length === 0) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const row of missingRows) {
      const email = row.email.toLowerCase();
      const passwordHash = await hashPassword(DEFAULT_USER_PASSWORD);
      await client.query(
        `INSERT INTO users (
           username, email, display_name, job_title, password_hash,
           is_active, must_change_password, role, vehicle_admin, meal_admin, approver_doa,
           password_changed_at
         )
         VALUES ($1, $2, $3, $4, $5, TRUE, TRUE, $6, $7, $8, $9, NOW())
         ON CONFLICT (email) DO NOTHING`,
        [
          email,
          email,
          email,
          null,
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
