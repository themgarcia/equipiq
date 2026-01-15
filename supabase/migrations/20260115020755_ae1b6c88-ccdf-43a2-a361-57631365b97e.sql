-- Add explicit deny policy for public access to profiles table
CREATE POLICY "Deny public access to profiles"
ON public.profiles
FOR SELECT
USING (false);

-- Add explicit deny policy for public access to subscriptions table
CREATE POLICY "Deny public access to subscriptions"
ON public.subscriptions
FOR SELECT
USING (false);