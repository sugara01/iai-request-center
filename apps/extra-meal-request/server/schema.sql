CREATE SEQUENCE IF NOT EXISTS vehicle_request_number_seq START 100;
CREATE SEQUENCE IF NOT EXISTS meal_request_number_seq START 100;

CREATE TABLE IF NOT EXISTS admin_access (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  vehicle_admin BOOLEAN NOT NULL DEFAULT FALSE,
  meal_admin BOOLEAN NOT NULL DEFAULT FALSE,
  super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (email = LOWER(email))
);

CREATE TABLE IF NOT EXISTS vehicle_requests (
  id BIGSERIAL PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  department_key TEXT NOT NULL,
  pickup_date DATE NOT NULL,
  pickup_time TEXT NOT NULL,
  pickup_point TEXT NOT NULL,
  destination_key TEXT NOT NULL,
  destination_other TEXT,
  purpose TEXT NOT NULL,
  requester_note TEXT,
  passenger_count INTEGER NOT NULL CHECK (passenger_count > 0),
  current_status_key TEXT NOT NULL DEFAULT 'Submitted',
  admin_decision_key TEXT,
  admin_note TEXT,
  director_decision_key TEXT,
  director_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_update TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (current_status_key IN (
    'Submitted', 'Approved', 'RejectedVehicleNotAvailable',
    'RejectedPlantDirector', 'PendingPlantDirectorApproval', 'Cancelled'
  ))
);

CREATE INDEX IF NOT EXISTS vehicle_requests_requester_created_idx
  ON vehicle_requests (LOWER(requester_email), created_at DESC);
CREATE INDEX IF NOT EXISTS vehicle_requests_status_idx
  ON vehicle_requests (current_status_key, created_at DESC);

CREATE TABLE IF NOT EXISTS meal_requests (
  id BIGSERIAL PRIMARY KEY,
  request_id TEXT NOT NULL,
  record_id TEXT NOT NULL UNIQUE,
  service_date DATE NOT NULL,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  department TEXT NOT NULL,
  purpose TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_hours NUMERIC(6, 2),
  meal_category TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  additional TEXT NOT NULL DEFAULT '',
  current_status TEXT NOT NULL DEFAULT 'Submitted'
    CHECK (current_status IN ('Submitted', 'Approved', 'Rejected', 'Cancelled')),
  approval_trigger BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (duration_hours IS NULL OR duration_hours > 0)
);

CREATE INDEX IF NOT EXISTS meal_requests_request_group_idx
  ON meal_requests (request_id, service_date);
CREATE INDEX IF NOT EXISTS meal_requests_requester_created_idx
  ON meal_requests (LOWER(requester_email), created_at DESC);

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_email TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO admin_access (email, vehicle_admin, meal_admin, super_admin)
VALUES
  ('riyan.sugara@ineos.com', TRUE, TRUE, TRUE),
  ('aris.kristanto@ineos.com', TRUE, FALSE, FALSE),
  ('defiani.defiani@ineos.com', FALSE, TRUE, FALSE),
  ('sri.aditia.demo@local.test', TRUE, TRUE, FALSE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO vehicle_requests (
  request_number, requester_name, requester_email, department_key, pickup_date,
  pickup_time, pickup_point, destination_key, purpose, passenger_count,
  current_status_key, created_at, last_update
)
VALUES (
  'RQ2611250001', 'Ayu Lestari', 'ayu.lestari@example.com', 'Commercial',
  CURRENT_DATE + 2, '08:00', 'INEOS Plant', 'JakartaMerak',
  'Customer visit (demo)', 2, 'Submitted', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'
)
ON CONFLICT (request_number) DO NOTHING;

INSERT INTO vehicle_requests (
  request_number, requester_name, requester_email, department_key, pickup_date,
  pickup_time, pickup_point, destination_key, purpose, passenger_count,
  current_status_key, admin_decision_key, admin_note, created_at, last_update
)
VALUES (
  'RQ2611240002', 'Ayu Lestari', 'ayu.lestari@example.com', 'Commercial',
  CURRENT_DATE + 5, '09:30', 'INEOS Plant', 'MerakJakartaHO',
  'Office meeting (demo)', 1, 'PendingPlantDirectorApproval', 'Available',
  'Vehicle is available (demo)', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
)
ON CONFLICT (request_number) DO NOTHING;

INSERT INTO meal_requests (
  request_id, record_id, service_date, requester_name, requester_email,
  department, purpose, start_date, end_date, meal_category, quantity,
  additional, current_status, approval_trigger, created_at
)
VALUES
  ('EMR-261125-01', 'EMR-261125-01-20261126', CURRENT_DATE + 1,
   'Ayu Lestari', 'ayu.lestari@example.com', 'Commercial', 'Customer workshop (demo)',
   CURRENT_DATE + 1, CURRENT_DATE + 2, 'Lunch', 8, 'Sample request for local testing',
   'Submitted', TRUE, NOW() - INTERVAL '3 hours'),
  ('EMR-261125-01', 'EMR-261125-01-20261127', CURRENT_DATE + 2,
   'Ayu Lestari', 'ayu.lestari@example.com', 'Commercial', 'Customer workshop (demo)',
   CURRENT_DATE + 1, CURRENT_DATE + 2, 'Lunch', 8, 'Sample request for local testing',
   'Submitted', FALSE, NOW() - INTERVAL '3 hours')
ON CONFLICT (record_id) DO NOTHING;
