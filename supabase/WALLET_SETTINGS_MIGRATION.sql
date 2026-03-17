-- ─────────────────────────────────────────────────────────────────────────────
-- Montera: platform_settings table
-- Run this once in your Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create table
create table if not exists public.platform_settings (
  key        text primary key,
  value      text not null default '',
  label      text,
  note       text,
  updated_at timestamptz default now()
);

-- 2. Row-Level Security
alter table public.platform_settings enable row level security;

-- Anyone can read (needed by the Deposit page to show wallet QR codes)
create policy "Public can read platform_settings"
  on public.platform_settings
  for select
  using (true);

-- Only admins can write
create policy "Admins can modify platform_settings"
  on public.platform_settings
  for all
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role = 'admin'
    )
  );

-- 3. Seed initial wallet addresses
insert into public.platform_settings (key, value, label, note) values
  ('wallet_ethereum',   '0xD379091d53aB2AC2998dCf9ee0471F0a358B05E2',      'Ethereum (ERC20)',          'Accepts ETH, USDC, USDT (ERC20) and other ERC20 tokens'),
  ('wallet_bitcoin',    'bc1q87td8rzqppk88637x68gnakh68ustt58jmgs6e',       'Bitcoin (BTC)',              'Native Bitcoin – Bech32 / SegWit address'),
  ('wallet_usdt_trc20', 'TH7K84Z1VLyxLFGXo66Hmxh4VTXqcVttVA',              'USDT (TRC20 / Tron)',        'TRC20 USDT only – do NOT send ERC20 USDT here'),
  ('wallet_solana',     '21vuzKftBCqeuhustJeinAhjjMFXVMdAooiBUkszksTk',    'Solana (SOL)',               'Accepts SOL and SPL tokens'),
  ('wallet_bsc',        '0xD379091d53aB2AC2998dCf9ee0471F0a358B05E2',      'BNB Smart Chain (BEP-20)',   'Accepts BNB, BUSD and BEP-20 tokens')
on conflict (key) do update
  set value      = excluded.value,
      updated_at = now();
