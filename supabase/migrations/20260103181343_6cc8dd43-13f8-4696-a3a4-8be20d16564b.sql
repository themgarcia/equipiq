-- Add financing columns to equipment table for cashflow visibility
-- NOTE: These fields are informational only and do NOT affect pricing or Buy vs Rent logic

ALTER TABLE public.equipment
ADD COLUMN financing_type text NOT NULL DEFAULT 'owned',
ADD COLUMN deposit_amount numeric NOT NULL DEFAULT 0,
ADD COLUMN financed_amount numeric NOT NULL DEFAULT 0,
ADD COLUMN monthly_payment numeric NOT NULL DEFAULT 0,
ADD COLUMN term_months integer NOT NULL DEFAULT 0,
ADD COLUMN buyout_amount numeric NOT NULL DEFAULT 0,
ADD COLUMN financing_start_date date;

-- Add a check constraint to ensure valid financing types
ALTER TABLE public.equipment
ADD CONSTRAINT valid_financing_type CHECK (financing_type IN ('owned', 'financed', 'leased'));