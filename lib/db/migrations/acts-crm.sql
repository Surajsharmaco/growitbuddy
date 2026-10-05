BEGIN;
CREATE TABLE IF NOT EXISTS acts_crm_records (
  id uuid PRIMARY KEY,
  submission_key uuid NOT NULL UNIQUE,
  checkout_id uuid UNIQUE REFERENCES acts_membership_checkouts(id),
  application jsonb NOT NULL,
  stage text NOT NULL DEFAULT 'new' CHECK (stage IN ('new','contacted','qualified','closed')),
  notes text NOT NULL DEFAULT '',
  follow_up_at timestamptz,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS acts_crm_updated_idx ON acts_crm_records(updated_at DESC);
CREATE TABLE IF NOT EXISTS acts_admin_sessions (
  token_hash text PRIMARY KEY,
  expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS acts_crm_settings (
  id integer PRIMARY KEY CHECK (id=1),
  workbook_id text NOT NULL DEFAULT '',
  last_sync_at timestamptz,
  last_sync_error text NOT NULL DEFAULT ''
);
INSERT INTO acts_crm_settings(id) VALUES (1) ON CONFLICT DO NOTHING;
INSERT INTO acts_crm_records(id, submission_key, checkout_id, application, created_at, updated_at)
SELECT id, id, id, application, created_at, created_at FROM acts_membership_checkouts
ON CONFLICT DO NOTHING;
COMMIT;