-- Create equipment_attachments table
CREATE TABLE public.equipment_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  value NUMERIC NOT NULL DEFAULT 0,
  serial_number TEXT,
  photo_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipment_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own attachments"
ON public.equipment_attachments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attachments"
ON public.equipment_attachments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attachments"
ON public.equipment_attachments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attachments"
ON public.equipment_attachments
FOR DELETE
USING (auth.uid() = user_id);