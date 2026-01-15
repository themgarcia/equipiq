-- Explicitly deny DELETE on insurance_change_log for audit integrity
-- This makes it clear that deletions are not allowed (immutable audit trail)
CREATE POLICY "No deletions allowed - audit integrity"
ON public.insurance_change_log
FOR DELETE
TO authenticated
USING (false);