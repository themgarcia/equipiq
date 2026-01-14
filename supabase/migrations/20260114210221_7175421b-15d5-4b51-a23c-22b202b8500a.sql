-- Block unauthenticated access to profiles table
CREATE POLICY "Deny public access to profiles"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (false);

-- Block unauthenticated access to equipment table  
CREATE POLICY "Deny public access to equipment"
  ON public.equipment
  FOR SELECT
  TO anon
  USING (false);

-- Add DELETE policy for email_preferences
CREATE POLICY "Users can delete their own email preferences"
  ON public.email_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);