-- =============================================
-- MONTERA FULL DATABASE SETUP
-- Paste this entire file into Supabase SQL Editor and Run
-- =============================================

-- ─── MIGRATION 1: Core Tables ─────────────────────────────────────────────────

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'enterprise');
CREATE TYPE public.kyc_status AS ENUM ('pending', 'submitted', 'under_review', 'approved', 'rejected');
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal', 'investment', 'return', 'fee');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE public.plan_risk_level AS ENUM ('conservative', 'moderate', 'growth', 'aggressive');
CREATE TYPE public.investment_status AS ENUM ('active', 'paused', 'completed', 'cancelled');

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  country TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.kyc_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status kyc_status NOT NULL DEFAULT 'pending',
  document_type TEXT,
  document_url TEXT,
  selfie_url TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'ethereum',
  label TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.investment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  risk_level plan_risk_level NOT NULL,
  min_investment DECIMAL(20, 2) NOT NULL DEFAULT 100,
  max_investment DECIMAL(20, 2),
  expected_return_min DECIMAL(5, 2),
  expected_return_max DECIMAL(5, 2),
  duration_days INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  allocation JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.investment_plans(id),
  amount DECIMAL(20, 2) NOT NULL,
  status investment_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  current_value DECIMAL(20, 2),
  total_return DECIMAL(20, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USDT',
  status transaction_status NOT NULL DEFAULT 'pending',
  reference TEXT,
  description TEXT,
  wallet_id UUID REFERENCES public.wallets(id),
  investment_id UUID REFERENCES public.investments(id),
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ─── RLS POLICIES ─────────────────────────────────────────────────────────────

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own kyc" ON public.kyc_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit kyc" ON public.kyc_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own kyc" ON public.kyc_verifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all kyc" ON public.kyc_verifications FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update kyc" ON public.kyc_verifications FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own wallets" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallets" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wallets" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wallets" ON public.wallets FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active plans" ON public.investment_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage plans" ON public.investment_plans FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own investments" ON public.investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create investments" ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all investments" ON public.investments FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update investments" ON public.investments FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ─── TRIGGERS: Auto-create profile + updated_at ───────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_kyc_updated_at BEFORE UPDATE ON public.kyc_verifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.investment_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── MIGRATION 2: Audit Logs + KYC Storage ────────────────────────────────────

CREATE TABLE public.audit_logs (
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
CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('kyc-documents', 'kyc-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own KYC docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own KYC docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins can view all KYC docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'kyc-documents' AND public.has_role(auth.uid(), 'admin'));

-- ─── MIGRATION 3: Notifications + Transaction Reviews ─────────────────────────

CREATE TABLE public.notifications (
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
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.transaction_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) NOT NULL,
  reviewed_by UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.transaction_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage reviews" ON public.transaction_reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ─── Realtime ─────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- ─── Avatars Storage Bucket ───────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Avatars are publicly accessible" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');

-- ─── NOTIFICATION TRIGGERS ────────────────────────────────────────────────────

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
CREATE TRIGGER on_investment_status_change AFTER UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.notify_on_investment_status();

-- ─── SEED: Investment Plans ───────────────────────────────────────────────────

INSERT INTO public.investment_plans (name, description, risk_level, min_investment, max_investment, expected_return_min, expected_return_max, duration_days, is_active, allocation)
VALUES
  ('Conservative Shield', 'A stable, low-risk portfolio designed to preserve capital with steady, predictable returns. Ideal for new investors or those seeking security.', 'conservative', 500, 50000, 4.0, 8.0, 90, true, '{"BTC": 30, "ETH": 20, "USDT": 40, "BNB": 10}'),
  ('Balanced Growth', 'A balanced mix of established cryptocurrencies offering moderate risk with solid growth potential. Perfect for investors seeking consistent returns.', 'moderate', 1000, 100000, 8.0, 15.0, 60, true, '{"BTC": 40, "ETH": 35, "SOL": 15, "BNB": 10}'),
  ('Growth Accelerator', 'Higher-growth exposure to top-performing assets with managed volatility. Suitable for investors comfortable with short-term fluctuations.', 'growth', 2500, 250000, 15.0, 28.0, 45, true, '{"ETH": 35, "SOL": 30, "BTC": 25, "AVAX": 10}'),
  ('Alpha Pursuit', 'Maximum growth strategy targeting emerging and high-momentum crypto assets. For experienced investors seeking maximum upside.', 'aggressive', 5000, null, 25.0, 55.0, 30, true, '{"SOL": 30, "AVAX": 25, "DOT": 20, "ARB": 15, "BTC": 10}');
