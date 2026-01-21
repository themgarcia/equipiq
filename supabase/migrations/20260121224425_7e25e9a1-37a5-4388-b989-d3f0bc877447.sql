-- Add explicit DENY policies for UPDATE and DELETE on metered_usage
-- to prevent any modifications to billing records
CREATE POLICY "No updates allowed - billing integrity"
  ON public.metered_usage
  FOR UPDATE
  USING (false);

CREATE POLICY "No deletions allowed - billing integrity"
  ON public.metered_usage
  FOR DELETE
  USING (false);

-- Add explicit DENY policies for UPDATE and DELETE on account_deletion_requests
-- Deletion requests should be immutable for audit purposes
CREATE POLICY "No updates allowed - audit integrity"
  ON public.account_deletion_requests
  FOR UPDATE
  USING (false);

CREATE POLICY "No deletions allowed - audit integrity"
  ON public.account_deletion_requests
  FOR DELETE
  USING (false);

-- Add explicit DENY policies for UPDATE and DELETE on feedback_replies
-- Replies should be immutable for conversation integrity
CREATE POLICY "No updates allowed - conversation integrity"
  ON public.feedback_replies
  FOR UPDATE
  USING (false);

CREATE POLICY "No deletions allowed - conversation integrity"
  ON public.feedback_replies
  FOR DELETE
  USING (false);

-- Add admin SELECT policy for user_roles table
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));