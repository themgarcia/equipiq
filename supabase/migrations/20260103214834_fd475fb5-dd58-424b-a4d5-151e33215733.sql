-- Fix storage RLS policies for equipment-documents bucket
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can upload equipment documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own equipment documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own equipment documents" ON storage.objects;

-- Create user-scoped policies that require files to be in user's folder
-- Files must be uploaded to paths like: {user_id}/filename.pdf

CREATE POLICY "Users can upload their own equipment documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'equipment-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own equipment documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'equipment-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own equipment documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'equipment-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own equipment documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'equipment-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);