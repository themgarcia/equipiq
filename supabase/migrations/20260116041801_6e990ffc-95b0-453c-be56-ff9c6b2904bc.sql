-- Remove ineffective "Deny public access" policies that add confusion
-- The user-specific policies (auth.uid() = user_id / id) already correctly restrict access

-- Drop the useless deny policy on insurance_settings
DROP POLICY IF EXISTS "Deny public access to insurance_settings" ON public.insurance_settings;

-- Drop the useless deny policy on profiles
DROP POLICY IF EXISTS "Deny public access to profiles" ON public.profiles;

-- Drop the useless deny policy on equipment (also has this pattern)
DROP POLICY IF EXISTS "Deny public access to equipment" ON public.equipment;

-- Drop the useless deny policy on subscriptions
DROP POLICY IF EXISTS "Deny public access to subscriptions" ON public.subscriptions;

-- Drop the useless deny policy on impersonation_sessions
DROP POLICY IF EXISTS "Deny public access to impersonation sessions" ON public.impersonation_sessions;