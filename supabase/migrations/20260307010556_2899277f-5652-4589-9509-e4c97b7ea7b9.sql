
-- Delete existing broken test users and recreate properly
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('test@monetra.com', 'admin@monetra.com')
);
DELETE FROM public.profiles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('test@monetra.com', 'admin@monetra.com')
);
DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('test@monetra.com', 'admin@monetra.com')
);
DELETE FROM auth.users WHERE email IN ('test@monetra.com', 'admin@monetra.com');
