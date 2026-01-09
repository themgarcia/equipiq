-- Add restrictive policies to user_roles table to prevent privilege escalation
-- The handle_new_user() trigger is SECURITY DEFINER so it bypasses RLS for initial role assignment

-- Policy: Only admins can INSERT new roles (normal users cannot grant themselves roles)
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can UPDATE roles
CREATE POLICY "Only admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can DELETE roles
CREATE POLICY "Only admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));