-- Add DELETE policy for insurance_settings table
CREATE POLICY "Users can delete their own insurance settings"
  ON public.insurance_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);