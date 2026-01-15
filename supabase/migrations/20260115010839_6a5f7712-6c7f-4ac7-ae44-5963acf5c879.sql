-- Fix profiles table RLS policies
-- The issue: All policies are RESTRICTIVE (using "AS RESTRICTIVE")
-- which means ALL must be true. A "deny" policy with USING(false) 
-- blocks all access including legitimate users.

-- Solution: Use PERMISSIVE policies (default) for legitimate access.
-- RLS already denies access when no policy matches, so no explicit deny needed.

-- Drop the problematic deny policy
DROP POLICY IF EXISTS "Deny public access to profiles" ON public.profiles;

-- Drop and recreate SELECT policies as PERMISSIVE (default behavior)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Recreate as PERMISSIVE policies (any matching policy grants access)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);