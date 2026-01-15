-- Add DELETE policy for user_notifications so users can clear their notifications
CREATE POLICY "Users can delete own notifications"
ON public.user_notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add UPDATE and DELETE policies for feedback so users can edit/remove their own feedback
CREATE POLICY "Users can update own feedback"
ON public.feedback
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback"
ON public.feedback
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);