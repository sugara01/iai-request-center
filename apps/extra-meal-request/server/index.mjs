import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import express from 'express';
import pg from 'pg';

const { Pool } = pg;
const port = Number(process.env.API_PORT ?? 3001);
const demoAuthEnabled = process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEMO_AUTH !== 'false';
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
  const { rows } = await pool.query('SELECT email FROM admin_access ORDER BY email');
  const users = new Map(demoUsers.map((user) => [user.email, user]));
  for (const row of rows) {
    if (!users.has(row.email)) users.set(row.email, { email: row.email, fullName: row.email });
  }
  res.json([...users.values()]);
});

app.use('/api', (req, _res, next) => {
  if (!demoAuthEnabled) return next(new HttpError(503, 'Demo authentication is disabled. Configure production authentication before deployment.'));
  const email = String(req.header('x-demo-user') ?? '').trim().toLowerCase();
  const user = demoUsers.find((candidate) => candidate.email === email);
  if (!user) return next(new HttpError(401, 'Select a valid local demo user.'));
  req.demoUser = user;
  next();
});

app.get('/api/session', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT vehicle_admin, meal_admin, super_admin FROM admin_access WHERE email = $1',
    [req.demoUser.email],
  );
  const access = rows[0] ?? {};
  res.json({
    userPrincipalName: req.demoUser.email,
    fullName: req.demoUser.fullName,
    jobTitle: req.demoUser.jobTitle ?? null,
    isVehicleAdmin: Boolean(access.vehicle_admin || access.super_admin),
    isMealAdmin: Boolean(access.meal_admin || access.super_admin),
    isSuperAdmin: Boolean(access.super_admin),
  });
});

app.get('/api/admin-access', async (req, res) => {
  await requireRole(req, 'super_admin');
  const { rows } = await pool.query(
    'SELECT id, email, vehicle_admin, meal_admin FROM admin_access ORDER BY email',
  );
  res.json(rows.map((row) => ({
    id: Number(row.id),
    title: row.email,
    vehicleAdmin: row.vehicle_admin ? 'Yes' : 'No',
    mealAdmin: row.meal_admin ? 'Yes' : 'No',
  })));
});

app.put('/api/admin-access/:email', async (req, res) => {
  await requireRole(req, 'super_admin');
  const email = String(req.params.email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Enter a valid email address.');
  const vehicleAdmin = Boolean(req.body.vehicleAdmin);
  const mealAdmin = Boolean(req.body.mealAdmin);
  const { rows } = await pool.query(
    `INSERT INTO admin_access (email, vehicle_admin, meal_admin)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE
       SET vehicle_admin = EXCLUDED.vehicle_admin, meal_admin = EXCLUDED.meal_admin
     RETURNING id, email, vehicle_admin, meal_admin`,
    [email, vehicleAdmin, mealAdmin],
  );
  await writeAudit(req.demoUser.email, 'admin_access', email, 'upsert', { vehicleAdmin, mealAdmin });
  res.json(mapAdminAccess(rows[0]));
});

app.delete('/api/admin-access/:id', async (req, res) => {
  await requireRole(req, 'super_admin');
  const id = parseId(req.params.id);
  const { rows } = await pool.query(
    'DELETE FROM admin_access WHERE id = $1 AND super_admin = FALSE RETURNING email',
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
  const { rows } = await pool.query(`SELECT ${role} AS allowed, super_admin FROM admin_access WHERE email = $1`, [req.demoUser.email]);
  return Boolean(rows[0]?.allowed || rows[0]?.super_admin);
}

async function requireRole(req, role) {
  if (!await hasRole(req, role)) throw new HttpError(403, 'You do not have permission to perform this action.');
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
