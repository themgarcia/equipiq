-- Allow admins to update any equipment (for category migration overrides)
CREATE POLICY "Admins can update all equipment"
ON public.equipment
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));