-- Add UPDATE policy for equipment_documents table
CREATE POLICY "Users can update their own documents"
ON public.equipment_documents
FOR UPDATE
USING (auth.uid() = user_id);