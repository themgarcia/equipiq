-- Add replacement_cost_as_of_date column to equipment table
ALTER TABLE public.equipment 
ADD COLUMN replacement_cost_as_of_date date NULL;