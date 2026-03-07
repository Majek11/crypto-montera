
-- Create test user and admin
-- First create users via auth
DO $$
DECLARE
  test_user_id uuid;
  admin_user_id uuid;
BEGIN
  -- Check if test user already exists
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@monetra.com';
  IF test_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, confirmation_token,
      raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated',
      'test@monetra.com',
      crypt('Test123!', gen_salt('bf')),
      now(), now(), now(), '',
      '{"provider":"email","providers":["email"]}',
      '{"display_name":"Test User"}',
      false
    ) RETURNING id INTO test_user_id;
    
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (test_user_id, test_user_id, jsonb_build_object('sub', test_user_id, 'email', 'test@monetra.com'), 'email', test_user_id, now(), now(), now());
  END IF;

  -- Check if admin user already exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@monetra.com';
  IF admin_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, confirmation_token,
      raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated',
      'admin@monetra.com',
      crypt('Admin123!', gen_salt('bf')),
      now(), now(), now(), '',
      '{"provider":"email","providers":["email"]}',
      '{"display_name":"Admin User"}',
      false
    ) RETURNING id INTO admin_user_id;
    
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (admin_user_id, admin_user_id, jsonb_build_object('sub', admin_user_id, 'email', 'admin@monetra.com'), 'email', admin_user_id, now(), now(), now());
  END IF;

  -- Give admin user the admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Create profiles for both
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (test_user_id, 'test@monetra.com', 'Test User')
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (admin_user_id, 'admin@monetra.com', 'Admin User')
  ON CONFLICT (user_id) DO NOTHING;
END $$;
