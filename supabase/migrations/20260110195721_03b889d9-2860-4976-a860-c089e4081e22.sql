-- Backfill subscription records for existing users who don't have one
INSERT INTO public.subscriptions (user_id, plan, status, beta_access, beta_access_granted_at, beta_access_notes, created_at, updated_at)
SELECT 
  p.id,
  'free',
  'active',
  true,
  NOW(),
  'Backfilled during admin subscription management update',
  NOW(),
  NOW()
FROM public.profiles p
LEFT JOIN public.subscriptions s ON p.id = s.user_id
WHERE s.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;