-- Update existing equipment records with new category names
UPDATE public.equipment SET category = 'Loader (Mini-Skid)' WHERE category = 'Mini Skid / Compact Power Carrier';
UPDATE public.equipment SET category = 'Loader (Skid / CTL)' WHERE category = 'Skid Steer (Standard)';
UPDATE public.equipment SET category = 'Loader (Skid / CTL)' WHERE category = 'Compact Track Loader';
UPDATE public.equipment SET category = 'Loader (Large / Wheel)' WHERE category = 'Large Loader';
UPDATE public.equipment SET category = 'Commercial Vehicle' WHERE category = 'Truck / Vehicle';
UPDATE public.equipment SET category = 'Lawn (Commercial)' WHERE category = 'Commercial Mowers';
UPDATE public.equipment SET category = 'Lawn (Handheld)' WHERE category = 'Handheld Lawn Equipment';
UPDATE public.equipment SET category = 'Compaction (Heavy)' WHERE category = 'Heavy Compaction Equipment';
UPDATE public.equipment SET category = 'Compaction (Light)' WHERE category = 'Light Compaction Equipment';