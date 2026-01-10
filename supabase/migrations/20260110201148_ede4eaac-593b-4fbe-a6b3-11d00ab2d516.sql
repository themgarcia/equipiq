-- Create admin activity log table
CREATE TABLE public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  target_user_id UUID NOT NULL,
  target_user_email TEXT NOT NULL,
  performed_by_user_id UUID NOT NULL,
  performed_by_email TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view the activity log
CREATE POLICY "Admins can view activity log"
ON public.admin_activity_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert into activity log
CREATE POLICY "Admins can insert activity log"
ON public.admin_activity_log
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for faster queries
CREATE INDEX idx_admin_activity_log_created_at 
ON public.admin_activity_log(created_at DESC);

CREATE INDEX idx_admin_activity_log_action_type 
ON public.admin_activity_log(action_type);