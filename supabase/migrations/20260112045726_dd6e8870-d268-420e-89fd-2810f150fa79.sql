-- Disable RLS on auth_rate_limits table
-- This table is only accessed by edge functions using the service role key,
-- which bypasses RLS anyway. Disabling RLS makes the intent explicit.
ALTER TABLE public.auth_rate_limits DISABLE ROW LEVEL SECURITY;