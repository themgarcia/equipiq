-- 1) feedback_replies: allow limited self-delete window + admin-only redaction

DROP POLICY IF EXISTS "No deletions allowed - conversation integrity" ON public.feedback_replies;
DROP POLICY IF EXISTS "No updates allowed - conversation integrity" ON public.feedback_replies;

-- Authors may remove their own reply within 15 minutes of posting
CREATE POLICY "Authors can delete own reply within 15 minutes"
ON public.feedback_replies
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND created_at > (now() - interval '15 minutes'));

-- Admins may redact any reply (message text only, enforced by trigger below)
CREATE POLICY "Admins can redact replies"
ON public.feedback_replies
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enforce that redaction can only change the message body, never provenance
CREATE OR REPLACE FUNCTION public.enforce_feedback_reply_redaction_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.feedback_id IS DISTINCT FROM OLD.feedback_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.is_admin_reply IS DISTINCT FROM OLD.is_admin_reply
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only the message body may be redacted on feedback replies';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_feedback_reply_redaction_only ON public.feedback_replies;
CREATE TRIGGER enforce_feedback_reply_redaction_only
BEFORE UPDATE ON public.feedback_replies
FOR EACH ROW EXECUTE FUNCTION public.enforce_feedback_reply_redaction_only();

-- 2) user_notifications: remove client-side notification authoring and
--    require any feedback-referencing notification to point at the recipient's own feedback

DROP POLICY IF EXISTS "Users can insert own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.user_notifications;

CREATE POLICY "Admins can insert notifications for owned references"
ON public.user_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND (
    reference_type IS NULL
    OR reference_id IS NULL
    OR (
      reference_type = 'feedback'
      AND EXISTS (
        SELECT 1 FROM public.feedback f
        WHERE f.id = reference_id AND f.user_id = user_notifications.user_id
      )
    )
  )
);
