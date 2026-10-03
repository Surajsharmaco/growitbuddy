BEGIN;
CREATE TABLE IF NOT EXISTS acts_membership_checkouts (
  id uuid PRIMARY KEY,
  order_id text NOT NULL UNIQUE,
  token_hash text NOT NULL UNIQUE,
  key_id text NOT NULL,
  application jsonb NOT NULL,
  amount integer NOT NULL CHECK (amount = 9900),
  currency text NOT NULL CHECK (currency = 'INR'),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'successful')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS acts_members (
  id uuid PRIMARY KEY,
  checkout_id uuid NOT NULL UNIQUE REFERENCES acts_membership_checkouts(id),
  payment_id text NOT NULL UNIQUE,
  application jsonb NOT NULL,
  amount integer NOT NULL CHECK (amount = 9900),
  currency text NOT NULL CHECK (currency = 'INR'),
  payment_status text NOT NULL DEFAULT 'successful' CHECK (payment_status = 'successful'),
  review_status text NOT NULL DEFAULT 'pending_review' CHECK (review_status = 'pending_review'),
  paid_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;