-- =============================================
-- BALANCE SYSTEM + PROFILE FIX
-- Run this in Supabase SQL Editor
-- =============================================

-- ─── Step 1: Add balance column to profiles ───────────────────────────────────

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS balance DECIMAL(20,2) NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- ─── Step 2: Create missing profiles for ALL existing auth users ───────────────

INSERT INTO public.profiles (user_id, email, display_name, referral_code, balance, status)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
  upper(substring(md5(u.id::text || random()::text), 1, 8)),
  0,
  'active'
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ─── Step 3: Assign 'user' role to any user missing one ───────────────────────

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::app_role
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- ─── Step 4: Back-fill referral codes for profiles that don't have one ────────

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$;

UPDATE public.profiles
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL;

-- ─── Step 5: RPC function for atomic investment creation ──────────────────────
-- This runs server-side to atomically: check balance → deduct → create investment

CREATE OR REPLACE FUNCTION public.create_investment(p_plan_id UUID, p_amount DECIMAL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_balance DECIMAL;
  v_plan RECORD;
  v_investment_id UUID;
  v_ends_at TIMESTAMPTZ;
BEGIN
  -- Validate user
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  -- Get current balance
  SELECT balance INTO v_balance FROM public.profiles WHERE user_id = v_user_id;

  -- Get plan details
  SELECT * INTO v_plan FROM public.investment_plans WHERE id = p_plan_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Plan not found or no longer active');
  END IF;

  -- Validate amount range
  IF p_amount < v_plan.min_investment THEN
    RETURN json_build_object('error', 'Minimum investment is $' || v_plan.min_investment);
  END IF;
  IF v_plan.max_investment IS NOT NULL AND p_amount > v_plan.max_investment THEN
    RETURN json_build_object('error', 'Maximum investment is $' || v_plan.max_investment);
  END IF;

  -- Check balance
  IF v_balance < p_amount THEN
    RETURN json_build_object('error', 'Insufficient balance. You have $' || ROUND(v_balance, 2) || ' available.');
  END IF;

  -- Calculate maturity date
  v_ends_at := now() + (v_plan.duration_days || ' days')::INTERVAL;

  -- Atomic: deduct balance
  UPDATE public.profiles SET balance = balance - p_amount WHERE user_id = v_user_id;

  -- Create investment record
  INSERT INTO public.investments (user_id, plan_id, amount, current_value, ends_at)
  VALUES (v_user_id, p_plan_id, p_amount, p_amount, v_ends_at)
  RETURNING id INTO v_investment_id;

  -- Record as an investment transaction
  INSERT INTO public.transactions (user_id, type, amount, currency, status, description, investment_id)
  VALUES (v_user_id, 'investment', p_amount, 'USD', 'completed', 'Invested in ' || v_plan.name, v_investment_id);

  RETURN json_build_object('success', true, 'investment_id', v_investment_id, 'ends_at', v_ends_at);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_investment(UUID, DECIMAL) TO authenticated;

-- ─── Step 6: Trigger — credit balance when deposit is confirmed ───────────────

CREATE OR REPLACE FUNCTION public.handle_balance_on_transaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  -- Deposit confirmed → credit balance
  IF NEW.type = 'deposit' AND NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    UPDATE public.profiles SET balance = balance + NEW.amount WHERE user_id = NEW.user_id;
  END IF;

  -- Withdrawal confirmed → nothing (already deducted at request time)
  -- Withdrawal failed → refund balance
  IF NEW.type = 'withdrawal' AND NEW.status = 'failed' AND OLD.status <> 'failed' THEN
    UPDATE public.profiles SET balance = balance + NEW.amount WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_balance_transaction_change ON public.transactions;
CREATE TRIGGER on_balance_transaction_change
  AFTER UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_balance_on_transaction();

-- ─── Step 7: Trigger — credit balance + returns when investment matures ───────

CREATE OR REPLACE FUNCTION public.handle_balance_on_investment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  -- Investment completed → credit amount + returns
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    UPDATE public.profiles
    SET balance = balance + COALESCE(NEW.current_value, NEW.amount + COALESCE(NEW.total_return, 0))
    WHERE user_id = NEW.user_id;
  END IF;

  -- Investment cancelled → refund original amount only
  IF NEW.status = 'cancelled' AND OLD.status = 'active' THEN
    UPDATE public.profiles
    SET balance = balance + NEW.amount
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_balance_investment_change ON public.investments;
CREATE TRIGGER on_balance_investment_change
  AFTER UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.handle_balance_on_investment();

-- ─── Step 8: Referrals table (if not exists already) ─────────────────────────

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  reward_amount DECIMAL(20,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referee_id)
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='referrals' AND policyname='Users can view own referrals') THEN
    CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id);
  END IF;
END $$;

GRANT SELECT ON public.referrals TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO authenticated;
