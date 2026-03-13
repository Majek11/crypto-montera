-- =============================================
-- REFERRAL TRACKING SETUP
-- Run in Supabase SQL Editor
-- =============================================

-- 1. Add referral_code column to referrals table if not present
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referred_id UUID REFERENCES auth.users(id);

-- 2. Make sure the referrals table has the right structure
-- referrer_id = the user who shared their link
-- referred_id = the new user who signed up via the link

-- 3. View that joins referral data with profile info (for admin)
CREATE OR REPLACE VIEW public.admin_referrals_view AS
SELECT
  r.id,
  r.created_at,
  r.status,
  r.reward_amount,
  r.referral_code,
  -- Referrer info
  referrer.display_name  AS referrer_name,
  referrer.email         AS referrer_email,
  referrer.user_id       AS referrer_id,
  -- Referred (new user) info
  referred.display_name  AS referred_name,
  referred.email         AS referred_email,
  referred.user_id       AS referred_user_id,
  referred.created_at    AS referred_joined_at
FROM public.referrals r
LEFT JOIN public.profiles referrer ON referrer.user_id = r.referrer_id
LEFT JOIN public.profiles referred ON referred.user_id = r.referred_id
ORDER BY r.created_at DESC;

-- 4. Allow admins to read referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='referrals' AND policyname='Admins can read all referrals') THEN
    CREATE POLICY "Admins can read all referrals"
    ON public.referrals FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = referrer_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='referrals' AND policyname='Authenticated users can insert referrals') THEN
    CREATE POLICY "Authenticated users can insert referrals"
    ON public.referrals FOR INSERT TO authenticated
    WITH CHECK (true);
  END IF;
END $$;

-- 5. Function to complete a referral and reward both users
CREATE OR REPLACE FUNCTION public.admin_complete_referral(
  p_referral_id UUID,
  p_reward_referrer DECIMAL DEFAULT 50,  -- $ reward for the referrer
  p_reward_referred DECIMAL DEFAULT 25   -- $ reward for the new user
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  SELECT * INTO v_ref FROM public.referrals WHERE id = p_referral_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Referral not found');
  END IF;

  -- Update referral status
  UPDATE public.referrals
  SET status = 'completed', reward_amount = p_reward_referrer
  WHERE id = p_referral_id;

  -- Credit referrer balance
  UPDATE public.profiles
  SET balance = balance + p_reward_referrer
  WHERE user_id = v_ref.referrer_id;

  -- Credit referred user balance
  UPDATE public.profiles
  SET balance = balance + p_reward_referred
  WHERE user_id = v_ref.referred_id;

  -- Notify referrer
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_ref.referrer_id,
    '🎉 Referral Reward!',
    'Your referral has made their first deposit. $' || p_reward_referrer || ' has been credited to your account!',
    'success'
  );

  -- Notify referred user
  IF v_ref.referred_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      v_ref.referred_id,
      '🎁 Welcome Bonus!',
      'You received a $' || p_reward_referred || ' welcome bonus for joining via a referral link!',
      'success'
    );
  END IF;

  RETURN json_build_object('success', true, 'referrer_rewarded', p_reward_referrer, 'referred_rewarded', p_reward_referred);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_complete_referral(UUID, DECIMAL, DECIMAL) TO authenticated;
