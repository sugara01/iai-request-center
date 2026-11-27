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

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  department TEXT,
  job_title TEXT,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  role TEXT NOT NULL DEFAULT 'User' CHECK (role IN ('User', 'ITAdmin', 'SuperAdmin')),
  vehicle_admin BOOLEAN NOT NULL DEFAULT FALSE,
  meal_admin BOOLEAN NOT NULL DEFAULT FALSE,
  approver_doa BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ,
  login_count INTEGER NOT NULL DEFAULT 0,
  CHECK (email = LOWER(email))
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx
  ON users (LOWER(username));

CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auth_sessions_user_active_idx
  ON auth_sessions (user_id, expires_at)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS user_notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'request_assigned', 'request_submitted', 'request_approved', 'request_rejected',
    'password_changed', 'password_reset'
  )),
  related_entity_type TEXT,
  related_entity_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'user_notifications'::regclass
      AND conname = 'user_notifications_event_type_check'
      AND (
        POSITION('request_submitted' IN pg_get_constraintdef(oid)) = 0
        OR POSITION('password_changed' IN pg_get_constraintdef(oid)) = 0
      )
  ) THEN
    ALTER TABLE user_notifications
      DROP CONSTRAINT user_notifications_event_type_check;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'user_notifications'::regclass
      AND conname = 'user_notifications_event_type_check'
  ) THEN
    ALTER TABLE user_notifications
      ADD CONSTRAINT user_notifications_event_type_check
      CHECK (event_type IN (
        'request_assigned', 'request_submitted', 'request_approved', 'request_rejected',
        'password_changed', 'password_reset'
      ));
  END IF;
END
$migration$;

CREATE INDEX IF NOT EXISTS user_notifications_user_created_idx
  ON user_notifications (user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS user_notifications_user_unread_idx
  ON user_notifications (user_id)
  WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS user_notifications_user_type_created_idx
  ON user_notifications (user_id, related_entity_type, created_at DESC, id DESC);

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

DELETE FROM user_notifications
WHERE related_entity_type = 'vehicle_request'
  AND related_entity_id IN ('RQ2611250001', 'RQ2611240002');

DELETE FROM user_notifications
WHERE related_entity_type = 'meal_request'
  AND related_entity_id = 'EMR-261125-01';

DELETE FROM audit_log
WHERE entity_type = 'vehicle_request'
  AND entity_id IN ('RQ2611250001', 'RQ2611240002');

DELETE FROM audit_log
WHERE entity_type = 'meal_request'
  AND entity_id = 'EMR-261125-01';

DELETE FROM meal_requests
WHERE request_id = 'EMR-261125-01'
  AND requester_email = 'ayu.lestari@example.com';

DELETE FROM vehicle_requests
WHERE request_number IN ('RQ2611250001', 'RQ2611240002')
  AND requester_email = 'ayu.lestari@example.com';
