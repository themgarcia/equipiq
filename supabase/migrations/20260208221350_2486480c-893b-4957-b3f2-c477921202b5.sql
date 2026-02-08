
-- Deny anonymous SELECT on profiles
CREATE POLICY "Deny anonymous access to profiles"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Deny anonymous SELECT on subscriptions
CREATE POLICY "Deny anonymous access to subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
