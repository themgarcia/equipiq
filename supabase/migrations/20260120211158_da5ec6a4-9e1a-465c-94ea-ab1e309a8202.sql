-- Add referral_source column to profiles table
ALTER TABLE public.profiles
ADD COLUMN referral_source text DEFAULT NULL;

-- Add column comment
COMMENT ON COLUMN public.profiles.referral_source IS 'Where the user heard about equipIQ';

-- Update the handle_new_user function to include referral_source
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name,
    company_name,
    industry,
    field_employees,
    annual_revenue,
    years_in_business,
    region,
    company_website,
    referral_source
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'industry',
    NEW.raw_user_meta_data ->> 'field_employees',
    NEW.raw_user_meta_data ->> 'annual_revenue',
    (NEW.raw_user_meta_data ->> 'years_in_business')::INTEGER,
    NEW.raw_user_meta_data ->> 'region',
    NEW.raw_user_meta_data ->> 'company_website',
    NEW.raw_user_meta_data ->> 'referral_source'
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;