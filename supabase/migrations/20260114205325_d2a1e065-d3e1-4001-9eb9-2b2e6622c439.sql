-- Add admin RLS policy to allow admins to view all equipment
CREATE POLICY "Admins can view all equipment"
  ON public.equipment
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));