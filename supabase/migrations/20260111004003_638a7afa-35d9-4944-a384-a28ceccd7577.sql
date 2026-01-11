-- First, drop the existing check constraint
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

-- Add new check constraint that includes 'beta'
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check 
CHECK (plan IN ('free', 'professional', 'business', 'beta'));

-- Update the new user trigger to create users with 'beta' plan instead of 'free' + beta_access
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.subscriptions (
    user_id, 
    plan, 
    status, 
    beta_access_notes
  )
  VALUES (
    NEW.id, 
    'beta', 
    'active', 
    'Signed up during open beta period'
  );
  
  INSERT INTO public.email_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$function$;