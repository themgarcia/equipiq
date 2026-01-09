-- Drop the existing overly specific SELECT policy and replace with one that requires authentication
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policy that requires authentication AND restricts to own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Also fix equipment_attachments table while we're at it
DROP POLICY IF EXISTS "Users can view their own attachments" ON public.equipment_attachments;

CREATE POLICY "Users can view their own attachments" 
ON public.equipment_attachments 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);