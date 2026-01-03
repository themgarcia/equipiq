-- Update vehicle category names to use consistent naming convention
UPDATE public.equipment SET category = 'Vehicle (Commercial)' WHERE category = 'Commercial Vehicle';
UPDATE public.equipment SET category = 'Vehicle (Light-Duty)' WHERE category = 'Light-Duty Vehicle';