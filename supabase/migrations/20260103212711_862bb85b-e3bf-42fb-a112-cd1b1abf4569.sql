-- Create storage bucket for equipment documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment-documents', 'equipment-documents', false);

-- RLS policy: users can upload their own equipment documents
CREATE POLICY "Users can upload equipment documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'equipment-documents');

-- RLS policy: users can view their own equipment documents
CREATE POLICY "Users can view their own equipment documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'equipment-documents');

-- RLS policy: users can delete their own equipment documents
CREATE POLICY "Users can delete their own equipment documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'equipment-documents');