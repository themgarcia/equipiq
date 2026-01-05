-- Add admin role for user (they already have 'user' role, this adds 'admin' as well)
INSERT INTO public.user_roles (user_id, role) 
VALUES ('5d7fdd0b-5376-462d-90aa-9f9176970343', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;