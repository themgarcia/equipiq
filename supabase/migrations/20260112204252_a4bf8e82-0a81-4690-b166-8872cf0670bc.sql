-- Create user_activity_log table for tracking user actions
CREATE TABLE public.user_activity_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    user_email text NOT NULL,
    action_type text NOT NULL,
    action_details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create error_log table for tracking errors with full diagnostic context
CREATE TABLE public.error_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    user_email text,
    error_source text NOT NULL,
    error_type text NOT NULL,
    error_message text NOT NULL,
    error_details jsonb DEFAULT '{}'::jsonb,
    severity text NOT NULL DEFAULT 'error',
    resolved boolean NOT NULL DEFAULT false,
    admin_notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_action_type ON public.user_activity_log(action_type);
CREATE INDEX idx_user_activity_log_created_at ON public.user_activity_log(created_at DESC);

CREATE INDEX idx_error_log_user_id ON public.error_log(user_id);
CREATE INDEX idx_error_log_error_source ON public.error_log(error_source);
CREATE INDEX idx_error_log_severity ON public.error_log(severity);
CREATE INDEX idx_error_log_resolved ON public.error_log(resolved);
CREATE INDEX idx_error_log_created_at ON public.error_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_activity_log
-- Users can insert their own activity (for frontend logging)
CREATE POLICY "Users can insert their own activity"
ON public.user_activity_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all activity
CREATE POLICY "Admins can view all activity"
ON public.user_activity_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for error_log
-- Users can insert errors (for frontend error reporting)
CREATE POLICY "Users can insert errors"
ON public.error_log
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Service role can insert errors (for edge functions)
-- This is handled by using service role key in edge functions

-- Admins can view all errors
CREATE POLICY "Admins can view all errors"
ON public.error_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update errors (to mark resolved, add notes)
CREATE POLICY "Admins can update errors"
ON public.error_log
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));