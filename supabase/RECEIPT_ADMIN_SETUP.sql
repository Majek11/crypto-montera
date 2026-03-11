-- =============================================
-- RECEIPT UPLOAD + ADMIN TRANSACTION MANAGEMENT
-- Run this in Supabase SQL Editor
-- =============================================

-- ─── Add receipt_url to transactions ──────────────────────────────────────────
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS network TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- ─── Admin RPC: Actually update transaction status ─────────────────────────────
-- This is the critical fix — admin approving/rejecting must update the tx status
-- which then fires the balance trigger

CREATE OR REPLACE FUNCTION public.admin_update_transaction(
  p_transaction_id UUID,
  p_status TEXT,           -- 'completed' | 'failed' | 'processing'
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx RECORD;
BEGIN
  -- Auth check
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Fetch transaction
  SELECT * INTO v_tx FROM public.transactions WHERE id = p_transaction_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Transaction not found');
  END IF;

  -- Update transaction status (this fires the balance trigger)
  UPDATE public.transactions
  SET status = p_status, updated_at = now()
  WHERE id = p_transaction_id;

  -- Log review
  INSERT INTO public.transaction_reviews (transaction_id, reviewed_by, status, notes, reviewed_at)
  VALUES (
    p_transaction_id,
    auth.uid(),
    CASE WHEN p_status = 'completed' THEN 'approved'
         WHEN p_status = 'failed' THEN 'rejected'
         ELSE 'processing' END,
    p_notes,
    now()
  )
  ON CONFLICT DO NOTHING;

  -- Notify user
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    v_tx.user_id,
    CASE
      WHEN p_status = 'completed' THEN '🎉 Deposit Confirmed!'
      WHEN p_status = 'failed'    THEN 'Transaction Failed'
      WHEN p_status = 'processing' THEN 'Transaction Being Processed'
    END,
    CASE
      WHEN p_status = 'completed' THEN
        'Your deposit of $' || v_tx.amount || ' ' || v_tx.currency || ' has been confirmed and credited to your account.'
      WHEN p_status = 'failed' THEN
        'Your ' || v_tx.type || ' of $' || v_tx.amount || ' ' || v_tx.currency || ' could not be processed.' ||
        COALESCE(' Reason: ' || p_notes, ' Please contact support.')
      WHEN p_status = 'processing' THEN
        'Your deposit of $' || v_tx.amount || ' ' || v_tx.currency || ' is being processed. This usually takes 10–30 minutes.'
    END,
    CASE WHEN p_status = 'completed' THEN 'success'
         WHEN p_status = 'failed' THEN 'error'
         ELSE 'info' END,
    '/transactions'
  );

  RETURN json_build_object('success', true, 'new_status', p_status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_transaction(UUID, TEXT, TEXT) TO authenticated;

-- ─── Storage: Create receipts bucket (if not exists) ─────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own receipts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload receipts') THEN
    CREATE POLICY "Users can upload receipts"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view receipts') THEN
    CREATE POLICY "Anyone can view receipts"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'receipts');
  END IF;
END $$;

-- Grant updated role for transactions to service_role
GRANT UPDATE ON public.transactions TO service_role;
