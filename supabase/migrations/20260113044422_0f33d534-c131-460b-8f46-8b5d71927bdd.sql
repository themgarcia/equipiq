-- Remove user_email column from error_log table to prevent sensitive data exposure
-- Admins can look up user email via user_id and profiles table if needed
ALTER TABLE public.error_log DROP COLUMN IF EXISTS user_email;