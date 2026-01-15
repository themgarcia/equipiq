-- Fix security: Update metered_usage policies to target authenticated role only
-- Currently targeting 'public' role which includes anonymous users

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own metered usage" ON public.metered_usage;
DROP POLICY IF EXISTS "Users can insert their own metered usage" ON public.metered_usage;

-- Recreate with authenticated role only
CREATE POLICY "Users can view their own metered usage"
ON public.metered_usage
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metered usage"
ON public.metered_usage
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);