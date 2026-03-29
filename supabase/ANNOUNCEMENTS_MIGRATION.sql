-- ─────────────────────────────────────────────────────────────────────────────
-- Montera: Platform Announcements Feature
-- Run this in your Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.platform_announcements (
  id         uuid        primary key default gen_random_uuid(),
  title      text        not null,
  message    text        not null,
  type       text        not null default 'info',  -- info | warning | success | maintenance
  is_active  boolean     not null default true,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.platform_announcements enable row level security;

-- Everyone (including unauthenticated) can read active non-expired announcements
drop policy if exists "Anyone reads active announcements" on public.platform_announcements;
create policy "Anyone reads active announcements"
  on public.platform_announcements for select
  using (
    is_active = true
    and (expires_at is null or expires_at > now())
  );

-- Only admins can insert / update / delete
drop policy if exists "Admins manage announcements" on public.platform_announcements;
create policy "Admins manage announcements"
  on public.platform_announcements for all
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Seed one example announcement (optional — delete after testing)
insert into public.platform_announcements (title, message, type, is_active)
values (
  '🎉 Welcome to Montera!',
  'We are excited to have you. Complete your KYC verification to unlock all platform features including withdrawals.',
  'info',
  true
);
