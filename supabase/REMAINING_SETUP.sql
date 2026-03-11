-- =============================================
-- MONTERA REMAINING SETUP (Safe to re-run)
-- Only creates what doesn't exist yet
-- =============================================

-- ─── Audit Logs ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='audit_logs' AND policyname='Users can view own audit logs') THEN
    CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='audit_logs' AND policyname='Users can insert own audit logs') THEN
    CREATE POLICY "Users can insert own audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='audit_logs' AND policyname='Admins can view all audit logs') THEN
    CREATE POLICY "Admins can view all audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- ─── KYC Documents Storage ────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('kyc-documents', 'kyc-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Users can upload own KYC docs') THEN
    CREATE POLICY "Users can upload own KYC docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Users can view own KYC docs') THEN
    CREATE POLICY "Users can view own KYC docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Admins can view all KYC docs') THEN
    CREATE POLICY "Admins can view all KYC docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'kyc-documents' AND public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- ─── Notifications Table ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Users can view own notifications') THEN
    CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Users can update own notifications') THEN
    CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Admins can insert notifications') THEN
    CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Admins can view all notifications') THEN
    CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- ─── Profile Extra Columns ────────────────────────────────────────────────────

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ─── Transaction Reviews Table ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.transaction_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) NOT NULL,
  reviewed_by UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.transaction_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='transaction_reviews' AND policyname='Admins can manage reviews') THEN
    CREATE POLICY "Admins can manage reviews" ON public.transaction_reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- ─── Realtime ─────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- ─── Avatars Storage ──────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Users can upload their own avatar') THEN
    CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Users can update their own avatar') THEN
    CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Users can delete their own avatar') THEN
    CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Avatars are publicly accessible') THEN
    CREATE POLICY "Avatars are publicly accessible" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
  END IF;
END $$;

-- ─── Notification Triggers ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_on_transaction_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.type = 'deposit' AND NEW.status = 'completed' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (NEW.user_id, '✅ Deposit Confirmed', 'Your deposit of ' || NEW.amount || ' ' || NEW.currency || ' has been confirmed and credited to your account.', 'success', '/transactions');
  END IF;
  IF NEW.type = 'deposit' AND NEW.status = 'failed' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (NEW.user_id, '❌ Deposit Failed', 'Your deposit of ' || NEW.amount || ' ' || NEW.currency || ' could not be processed. Please contact support.', 'error', '/transactions');
  END IF;
  IF NEW.type = 'withdrawal' AND NEW.status = 'completed' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (NEW.user_id, '💸 Withdrawal Sent', 'Your withdrawal of ' || NEW.amount || ' ' || NEW.currency || ' has been processed and sent to your wallet.', 'success', '/transactions');
  END IF;
  IF NEW.type = 'withdrawal' AND NEW.status = 'failed' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (NEW.user_id, '❌ Withdrawal Failed', 'Your withdrawal of ' || NEW.amount || ' ' || NEW.currency || ' was unsuccessful. Funds have been returned.', 'error', '/transactions');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_transaction_status_change ON public.transactions;
CREATE TRIGGER on_transaction_status_change AFTER UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.notify_on_transaction_status();

CREATE OR REPLACE FUNCTION public.notify_on_kyc_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status = 'under_review' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (NEW.user_id, '🔍 KYC Under Review', 'Your identity verification documents are being reviewed. This typically takes 1–3 business days.', 'info', '/kyc');
  END IF;
  IF NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (NEW.user_id, '🎉 KYC Approved!', 'Your identity has been verified. You now have full access to all Montera features.', 'success', '/dashboard');
  END IF;
  IF NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (NEW.user_id, '⚠️ KYC Rejected', 'Your KYC submission was not accepted. Please review the feedback and resubmit your documents.', 'warning', '/kyc');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_kyc_status_change ON public.kyc_verifications;
CREATE TRIGGER on_kyc_status_change AFTER UPDATE ON public.kyc_verifications FOR EACH ROW EXECUTE FUNCTION public.notify_on_kyc_status();

CREATE OR REPLACE FUNCTION public.notify_on_investment_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE plan_name TEXT;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  SELECT name INTO plan_name FROM public.investment_plans WHERE id = NEW.plan_id;
  IF NEW.status = 'completed' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (NEW.user_id, '🏆 Investment Matured!', 'Your ' || COALESCE(plan_name, 'investment') || ' plan has completed. Your returns are ready.', 'success', '/plans');
  END IF;
  IF NEW.status = 'paused' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (NEW.user_id, '⏸ Investment Paused', 'Your ' || COALESCE(plan_name, 'investment') || ' has been temporarily paused. We will notify you when it resumes.', 'warning', '/plans');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_investment_status_change ON public.investments;
CREATE TRIGGER on_investment_status_change AFTER UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.notify_on_investment_status();

-- ─── Seed: Investment Plans ───────────────────────────────────────────────────

INSERT INTO public.investment_plans (name, description, risk_level, min_investment, max_investment, expected_return_min, expected_return_max, duration_days, is_active, allocation)
SELECT * FROM (VALUES
  ('Conservative Shield', 'A stable, low-risk portfolio designed to preserve capital with steady, predictable returns. Ideal for new investors or those seeking security.', 'conservative'::plan_risk_level, 500::decimal, 50000::decimal, 4.0::decimal, 8.0::decimal, 90, true, '{"BTC": 30, "ETH": 20, "USDT": 40, "BNB": 10}'::jsonb),
  ('Balanced Growth', 'A balanced mix of established cryptocurrencies offering moderate risk with solid growth potential. Perfect for investors seeking consistent returns.', 'moderate'::plan_risk_level, 1000::decimal, 100000::decimal, 8.0::decimal, 15.0::decimal, 60, true, '{"BTC": 40, "ETH": 35, "SOL": 15, "BNB": 10}'::jsonb),
  ('Growth Accelerator', 'Higher-growth exposure to top-performing assets with managed volatility. Suitable for investors comfortable with short-term fluctuations.', 'growth'::plan_risk_level, 2500::decimal, 250000::decimal, 15.0::decimal, 28.0::decimal, 45, true, '{"ETH": 35, "SOL": 30, "BTC": 25, "AVAX": 10}'::jsonb),
  ('Alpha Pursuit', 'Maximum growth strategy targeting emerging and high-momentum crypto assets. For experienced investors seeking maximum upside.', 'aggressive'::plan_risk_level, 5000::decimal, null, 25.0::decimal, 55.0::decimal, 30, true, '{"SOL": 30, "AVAX": 25, "DOT": 20, "ARB": 15, "BTC": 10}'::jsonb)
) AS v(name, description, risk_level, min_investment, max_investment, expected_return_min, expected_return_max, duration_days, is_active, allocation)
WHERE NOT EXISTS (SELECT 1 FROM public.investment_plans LIMIT 1);
