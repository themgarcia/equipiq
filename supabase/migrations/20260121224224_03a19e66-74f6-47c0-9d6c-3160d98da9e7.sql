-- Add DELETE policy to usage_tracking that prevents all deletions
-- This protects billing and analytics data integrity
CREATE POLICY "No deletions allowed - billing integrity"
  ON public.usage_tracking
  FOR DELETE
  USING (false);