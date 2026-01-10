-- Add insurance fields to equipment table
ALTER TABLE public.equipment
ADD COLUMN IF NOT EXISTS is_insured boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS insurance_declared_value numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS insurance_notes text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS insurance_reviewed_at timestamp with time zone DEFAULT NULL;

-- Add insurance fields to equipment_attachments table
ALTER TABLE public.equipment_attachments
ADD COLUMN IF NOT EXISTS is_insured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS insurance_declared_value numeric DEFAULT NULL;

-- Create insurance_change_log table (append-only)
CREATE TABLE public.insurance_change_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  equipment_id uuid DEFAULT NULL,
  equipment_name text NOT NULL,
  change_type text NOT NULL CHECK (change_type IN ('added', 'removed', 'value_changed')),
  reason text NOT NULL CHECK (reason IN ('sold', 'retired', 'lost', 'traded', 'new_equipment', 'manual')),
  previous_declared_value numeric DEFAULT NULL,
  new_declared_value numeric DEFAULT NULL,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'confirmed')),
  sent_at timestamp with time zone DEFAULT NULL,
  confirmed_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on insurance_change_log
ALTER TABLE public.insurance_change_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for insurance_change_log (append-only: no delete allowed)
CREATE POLICY "Users can view their own insurance change logs"
  ON public.insurance_change_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insurance change logs"
  ON public.insurance_change_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insurance change logs"
  ON public.insurance_change_log
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create insurance_settings table (one per user)
CREATE TABLE public.insurance_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  broker_name text DEFAULT NULL,
  broker_company text DEFAULT NULL,
  broker_email text DEFAULT NULL,
  broker_phone text DEFAULT NULL,
  policy_number text DEFAULT NULL,
  policy_renewal_date date DEFAULT NULL,
  renewal_reminder_days integer NOT NULL DEFAULT 60,
  renewal_confirmed_at timestamp with time zone DEFAULT NULL,
  last_pre_renewal_reminder_at timestamp with time zone DEFAULT NULL,
  last_post_renewal_reminder_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on insurance_settings
ALTER TABLE public.insurance_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for insurance_settings
CREATE POLICY "Users can view their own insurance settings"
  ON public.insurance_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insurance settings"
  ON public.insurance_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insurance settings"
  ON public.insurance_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add insurance_renewal_reminders to email_preferences
ALTER TABLE public.email_preferences
ADD COLUMN IF NOT EXISTS insurance_renewal_reminders boolean NOT NULL DEFAULT true;

-- Create trigger for updated_at on insurance_settings
CREATE TRIGGER update_insurance_settings_updated_at
  BEFORE UPDATE ON public.insurance_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();