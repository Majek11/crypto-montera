-- ─────────────────────────────────────────────────────────────────────────────
-- Montera: Extended Profile Columns + Storage Fix
-- Run this in your Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add extended profile columns (safe to re-run)
alter table public.profiles
  add column if not exists date_of_birth  date,
  add column if not exists nationality    text,
  add column if not exists occupation     text,
  add column if not exists street_address text,
  add column if not exists city           text,
  add column if not exists state_province text,
  add column if not exists postal_code    text;

-- 2. Create / fix avatars storage bucket (public read)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true, 2097152,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update
  set public              = true,
      file_size_limit     = 2097152,
      allowed_mime_types  = array['image/jpeg','image/png','image/webp','image/gif'];

-- 3. Storage RLS policies for avatars bucket

-- Drop if they already exist (prevents duplicate policy errors)
drop policy if exists "Public read avatars"                on storage.objects;
drop policy if exists "Authenticated users upload avatars" on storage.objects;
drop policy if exists "Authenticated users update avatars" on storage.objects;
drop policy if exists "Authenticated users delete avatars" on storage.objects;

-- Allow anyone to view avatars (needed for <img src> to work)
create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Allow authenticated users to upload into their own folder
create policy "Authenticated users upload avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update their own avatars
create policy "Authenticated users update avatars"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own avatars
create policy "Authenticated users delete avatars"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
