-- Create feedback_replies table for conversation threads
CREATE TABLE public.feedback_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_admin_reply BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback_replies ENABLE ROW LEVEL SECURITY;

-- Users can view replies on their own feedback
CREATE POLICY "Users can view replies on own feedback"
ON public.feedback_replies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.feedback f
    WHERE f.id = feedback_id AND f.user_id = auth.uid()
  )
);

-- Admins can view all replies
CREATE POLICY "Admins can view all replies"
ON public.feedback_replies
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can insert replies on their own feedback (non-admin replies only)
CREATE POLICY "Users can insert replies on own feedback"
ON public.feedback_replies
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND is_admin_reply = false
  AND EXISTS (
    SELECT 1 FROM public.feedback f
    WHERE f.id = feedback_id AND f.user_id = auth.uid()
  )
);

-- Admins can insert replies on any feedback (admin replies only)
CREATE POLICY "Admins can insert replies"
ON public.feedback_replies
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND is_admin_reply = true
  AND auth.uid() = user_id
);

-- Create user_notifications table
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.user_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.user_notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can insert notifications for any user
CREATE POLICY "Admins can insert notifications"
ON public.user_notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can insert notifications for themselves (for system-generated ones)
CREATE POLICY "Users can insert own notifications"
ON public.user_notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_feedback_replies_feedback_id ON public.feedback_replies(feedback_id);
CREATE INDEX idx_feedback_replies_created_at ON public.feedback_replies(created_at);
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_is_read ON public.user_notifications(is_read);
CREATE INDEX idx_user_notifications_created_at ON public.user_notifications(created_at);