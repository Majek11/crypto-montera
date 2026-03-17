-- ─────────────────────────────────────────────────────────────────────────────
-- Montera: Investment Plans RESET
-- Run this in Supabase SQL Editor to remove old plans and insert only the
-- 5 correct tiers: Shield, Growth, Accelerator, Alpha, Enterprise.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Break FK chain: null out investment references in transactions
update public.transactions
set investment_id = null
where investment_id in (select id from public.investments);

-- 2. Delete all investments linked to the old plans
delete from public.investments;

-- 3. Delete ALL existing plans (old names/amounts)
delete from public.investment_plans;


-- 2. Ensure unique constraint on name exists
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.investment_plans'::regclass
      and conname  = 'investment_plans_name_key'
  ) then
    alter table public.investment_plans
      add constraint investment_plans_name_key unique (name);
  end if;
end $$;

-- 3. Insert the 5 correct tiers
insert into public.investment_plans
  (name, description, risk_level, min_investment, max_investment,
   expected_return_min, expected_return_max, duration_days, is_active)
values
  (
    'Shield',
    'Low-risk entry plan for new investors. Steady, predictable returns to help you build a solid crypto foundation.',
    'conservative',
    100, 1499,
    5, 8,
    30, true
  ),
  (
    'Growth',
    'Balanced portfolio targeting consistent mid-term growth through diversified crypto and DeFi positions.',
    'moderate',
    1500, 14999,
    10, 18,
    60, true
  ),
  (
    'Accelerator',
    'High-conviction positions in top-performing assets for investors ready to scale aggressively.',
    'growth',
    15000, 49999,
    20, 35,
    90, true
  ),
  (
    'Alpha',
    'Premium strategy for serious capital — institutional-grade assets, deeper DeFi exposure, and outsized return potential.',
    'aggressive',
    50000, 199999,
    35, 60,
    180, true
  ),
  (
    'Enterprise',
    'Custom white-glove investment strategy for large capital deployments. Contact our team to get started.',
    'aggressive',
    200000, null,
    50, 100,
    365, true
  );
