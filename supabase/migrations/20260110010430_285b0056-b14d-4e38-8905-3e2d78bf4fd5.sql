-- Add allocation_type column to equipment table
-- This allows classifying equipment as operational, overhead-only, or owner perks

ALTER TABLE public.equipment
ADD COLUMN allocation_type TEXT NOT NULL DEFAULT 'operational';

-- Add check constraint for valid values
ALTER TABLE public.equipment
ADD CONSTRAINT equipment_allocation_type_check 
CHECK (allocation_type IN ('operational', 'overhead_only', 'owner_perk'));

-- Add comment explaining the field
COMMENT ON COLUMN public.equipment.allocation_type IS 
'Classification of equipment: operational (charged to jobs), overhead_only (business overhead), owner_perk (excluded from overhead recovery, comes from net profits)';