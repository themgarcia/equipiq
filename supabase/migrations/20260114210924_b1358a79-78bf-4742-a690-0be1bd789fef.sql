-- Create impersonation sessions table for audit logging
CREATE TABLE public.impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  impersonated_user_id UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage impersonation sessions
CREATE POLICY "Admins can view impersonation sessions"
  ON public.impersonation_sessions
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert impersonation sessions"
  ON public.impersonation_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update impersonation sessions"
  ON public.impersonation_sessions
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Block anonymous access
CREATE POLICY "Deny public access to impersonation sessions"
  ON public.impersonation_sessions
  FOR SELECT
  TO anon
  USING (false);