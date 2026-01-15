-- Add explicit deny policy for public access to insurance_settings table
CREATE POLICY "Deny public access to insurance_settings"
ON public.insurance_settings
FOR SELECT
USING (false);