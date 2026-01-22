-- Drop and recreate the user SELECT policy with explicit auth check
DROP POLICY IF EXISTS "Users can view replies on own feedback" ON public.feedback_replies;

CREATE POLICY "Users can view replies on own feedback"
ON public.feedback_replies
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM feedback f
    WHERE f.id = feedback_replies.feedback_id 
    AND f.user_id = auth.uid()
  )
);

-- Drop and recreate the admin SELECT policy with explicit auth check
DROP POLICY IF EXISTS "Admins can view all replies" ON public.feedback_replies;

CREATE POLICY "Admins can view all replies"
ON public.feedback_replies
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);