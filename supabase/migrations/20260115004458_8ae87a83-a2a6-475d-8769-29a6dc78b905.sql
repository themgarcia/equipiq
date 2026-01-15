-- Add new columns to feedback table for screenshot and page context
ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS screenshot_url text,
ADD COLUMN IF NOT EXISTS page_url text,
ADD COLUMN IF NOT EXISTS page_title text;

-- Create storage bucket for feedback screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('feedback-screenshots', 'feedback-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: Users can upload screenshots to their own folder
CREATE POLICY "Users can upload their own feedback screenshots"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'feedback-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policy: Users can view their own screenshots
CREATE POLICY "Users can view their own feedback screenshots"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'feedback-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policy: Admins can view all feedback screenshots
CREATE POLICY "Admins can view all feedback screenshots"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'feedback-screenshots' 
  AND has_role(auth.uid(), 'admin'::app_role)
);