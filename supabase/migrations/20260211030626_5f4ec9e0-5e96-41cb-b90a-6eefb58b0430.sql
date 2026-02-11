
-- Add distance_unit preference to profiles
ALTER TABLE public.profiles ADD COLUMN distance_unit text DEFAULT 'mi';

-- Swap excavator category names (Compact ↔ Mini descriptions swapped in spec)
UPDATE public.equipment SET category = 'Construction — Excavator — TEMP_SWAP' WHERE category = 'Construction — Excavator — Compact';
UPDATE public.equipment SET category = 'Construction — Excavator — Compact' WHERE category = 'Construction — Excavator — Mini';
UPDATE public.equipment SET category = 'Construction — Excavator — Mini' WHERE category = 'Construction — Excavator — TEMP_SWAP';

-- Rename categories to match new taxonomy
UPDATE public.equipment SET category = 'Construction — Concrete — Mixer' WHERE category = 'Construction — Concrete Mixer';
UPDATE public.equipment SET category = 'Construction — Concrete — Vibrator' WHERE category = 'Construction — Concrete Vibrator';
UPDATE public.equipment SET category = 'Construction — Loader — Backhoe' WHERE category = 'Construction — Backhoe Loader';
UPDATE public.equipment SET category = 'Construction — Loader — Mini Skid Steer' WHERE category = 'Construction — Loader — Stand-On';
UPDATE public.equipment SET category = 'Shop — Welder' WHERE category = 'Shop — Welder — Portable';

-- Update handle_new_user trigger to set distance_unit based on region
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _region text;
  _distance_unit text := 'mi';
BEGIN
  _region := NEW.raw_user_meta_data ->> 'region';
  
  -- Canadian provinces use km
  IF _region IN ('AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT') THEN
    _distance_unit := 'km';
  END IF;

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
    referral_source,
    distance_unit
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
    NEW.raw_user_meta_data ->> 'referral_source',
    _distance_unit
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;
