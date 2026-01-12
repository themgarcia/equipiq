-- Re-enable RLS on auth_rate_limits table
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Add a policy that explicitly denies all client access
-- This table is only accessed by edge functions using the service role key (which bypasses RLS)
-- The policy returns false to block any client-side access attempts
CREATE POLICY "No client access - service role only" 
ON public.auth_rate_limits
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);