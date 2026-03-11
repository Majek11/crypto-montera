
-- Delete existing broken test users and recreate properly
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('test@montera.com', 'admin@montera.com')
);
DELETE FROM public.profiles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('test@montera.com', 'admin@montera.com')
);
DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('test@montera.com', 'admin@montera.com')
);
DELETE FROM auth.users WHERE email IN ('test@montera.com', 'admin@montera.com');
