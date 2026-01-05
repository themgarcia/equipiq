-- Create equipment_documents table to track document attachments
CREATE TABLE public.equipment_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  file_type text NOT NULL,
  notes text,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipment_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for equipment_documents
CREATE POLICY "Users can view their own documents"
  ON public.equipment_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON public.equipment_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON public.equipment_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Storage policies for equipment-documents bucket
-- Allow users to upload documents to their own folder
CREATE POLICY "Users can upload equipment documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'equipment-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to view their own documents
CREATE POLICY "Users can view their equipment documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'equipment-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their equipment documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'equipment-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );