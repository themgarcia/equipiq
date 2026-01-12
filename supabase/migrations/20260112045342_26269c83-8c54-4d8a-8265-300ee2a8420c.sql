-- Create auth_rate_limits table for tracking authentication attempts
CREATE TABLE public.auth_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  action_type TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index for efficient lookups
CREATE UNIQUE INDEX idx_auth_rate_limits_identifier_action 
ON public.auth_rate_limits (identifier, action_type);

-- Create index for cleanup of old records
CREATE INDEX idx_auth_rate_limits_first_attempt 
ON public.auth_rate_limits (first_attempt_at);

-- Enable RLS
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed - this table is only accessed by edge functions using service role key

-- Add trigger for updated_at
CREATE TRIGGER update_auth_rate_limits_updated_at
BEFORE UPDATE ON public.auth_rate_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create cleanup function to delete old records (> 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.auth_rate_limits
  WHERE first_attempt_at < now() - INTERVAL '24 hours';
END;
$$;