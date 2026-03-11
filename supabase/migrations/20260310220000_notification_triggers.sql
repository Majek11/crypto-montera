-- =============================================
-- AUTO-NOTIFICATION TRIGGERS
-- Automatically insert into notifications table
-- when key events happen (deposit confirmed,
-- KYC status change, investment events)
-- =============================================

-- ─── 1. DEPOSIT / WITHDRAWAL STATUS CHANGE ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_on_transaction_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when status actually changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Deposit confirmed
  IF NEW.type = 'deposit' AND NEW.status = 'completed' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      '✅ Deposit Confirmed',
      'Your deposit of ' || NEW.amount || ' ' || NEW.currency || ' has been confirmed and credited to your account.',
      'success',
      '/transactions'
    );
  END IF;

  -- Deposit failed
  IF NEW.type = 'deposit' AND NEW.status = 'failed' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      '❌ Deposit Failed',
      'Your deposit of ' || NEW.amount || ' ' || NEW.currency || ' could not be processed. Please contact support.',
      'error',
      '/transactions'
    );
  END IF;

  -- Withdrawal approved / sent
  IF NEW.type = 'withdrawal' AND NEW.status = 'completed' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      '💸 Withdrawal Sent',
      'Your withdrawal of ' || NEW.amount || ' ' || NEW.currency || ' has been processed and sent to your wallet.',
      'success',
      '/transactions'
    );
  END IF;

  -- Withdrawal failed
  IF NEW.type = 'withdrawal' AND NEW.status = 'failed' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      '❌ Withdrawal Failed',
      'Your withdrawal of ' || NEW.amount || ' ' || NEW.currency || ' was unsuccessful. Funds have been returned to your account.',
      'error',
      '/transactions'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_transaction_status_change
  AFTER UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_transaction_status();


-- ─── 2. KYC STATUS CHANGE ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_on_kyc_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- KYC under review
  IF NEW.status = 'under_review' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      '🔍 KYC Under Review',
      'Your identity verification documents are being reviewed. This typically takes 1–3 business days.',
      'info',
      '/kyc'
    );
  END IF;

  -- KYC approved
  IF NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      '🎉 KYC Approved!',
      'Your identity has been verified. You now have full access to all Montera features including withdrawals.',
      'success',
      '/dashboard'
    );
  END IF;

  -- KYC rejected
  IF NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      '⚠️ KYC Rejected',
      'Your KYC submission was not accepted. Please review the feedback and resubmit your documents.',
      'warning',
      '/kyc'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_kyc_status_change
  AFTER UPDATE ON public.kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_kyc_status();


-- ─── 3. INVESTMENT MATURITY NOTIFICATION ──────────────────────────────────
-- Fires when an admin marks an investment as 'completed'

CREATE OR REPLACE FUNCTION public.notify_on_investment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_name TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get plan name
  SELECT name INTO plan_name FROM public.investment_plans WHERE id = NEW.plan_id;

  -- Investment matured / completed
  IF NEW.status = 'completed' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      '🏆 Investment Matured!',
      'Your ' || COALESCE(plan_name, 'investment') || ' plan has completed. Your returns of $' || 
        COALESCE(NEW.total_return::TEXT, '0') || ' are ready.',
      'success',
      '/plans'
    );
  END IF;

  -- Investment paused (admin action)
  IF NEW.status = 'paused' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      '⏸ Investment Paused',
      'Your ' || COALESCE(plan_name, 'investment') || ' plan has been temporarily paused. We will notify you when it resumes.',
      'warning',
      '/plans'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_investment_status_change
  AFTER UPDATE ON public.investments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_investment_status();
