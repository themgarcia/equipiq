-- Add company profile columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN company_name TEXT,
ADD COLUMN industry TEXT,
ADD COLUMN field_employees TEXT,
ADD COLUMN annual_revenue TEXT,
ADD COLUMN years_in_business INTEGER,
ADD COLUMN region TEXT,
ADD COLUMN company_website TEXT;

-- Update the handle_new_user trigger to save company data from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    company_website
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
    NEW.raw_user_meta_data ->> 'company_website'
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;