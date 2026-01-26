-- Add entry_source column to track how equipment was added
ALTER TABLE public.equipment 
ADD COLUMN entry_source TEXT NOT NULL DEFAULT 'manual';

-- Add comment for documentation
COMMENT ON COLUMN public.equipment.entry_source IS 
  'How the equipment was added: manual, ai_document, or spreadsheet';

-- Create index for efficient grouping queries
CREATE INDEX idx_equipment_entry_source ON public.equipment(entry_source);