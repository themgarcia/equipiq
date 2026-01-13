-- Remove user_email column from user_activity_log to prevent email exposure
ALTER TABLE public.user_activity_log DROP COLUMN IF EXISTS user_email;