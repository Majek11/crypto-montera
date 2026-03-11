-- =============================================
-- FIX: Transaction Status Type + Receipt RLS
-- Run this in Supabase SQL Editor
-- =============================================

-- ─── Fix 1: Allow users to update receipt_url on their own transactions ────────
-- (This is why receipts weren't saving — RLS was blocking the UPDATE)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='transactions' AND policyname='Users can update own receipt_url') THEN
    CREATE POLICY "Users can update own receipt_url"
    ON public.transactions FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ─── Fix 2: Replace admin_update_transaction with correct type casts ───────────
-- The previous version passed TEXT to a transaction_status ENUM column → error
CREATE OR REPLACE FUNCTION public.admin_update_transaction(
  p_transaction_id UUID,
  p_status TEXT,
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
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  SELECT * INTO v_tx FROM public.transactions WHERE id = p_transaction_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Transaction not found');
  END IF;

  -- Cast TEXT → transaction_status enum to fix the type error
  UPDATE public.transactions
  SET status = p_status::transaction_status
  WHERE id = p_transaction_id;

  -- Log review (only if table exists)
  BEGIN
    INSERT INTO public.transaction_reviews (transaction_id, reviewed_by, status, notes, reviewed_at)
    VALUES (
      p_transaction_id,
      auth.uid(),
      CASE
        WHEN p_status = 'completed'  THEN 'approved'
        WHEN p_status = 'failed'     THEN 'rejected'
        ELSE 'processing'
      END,
      p_notes,
      now()
    );
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Don't fail if transaction_reviews doesn't exist
  END;

  -- Notify user
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    v_tx.user_id,
    CASE
      WHEN p_status = 'completed'   THEN '🎉 Deposit Confirmed!'
      WHEN p_status = 'failed'      THEN 'Transaction Failed'
      WHEN p_status = 'processing'  THEN 'Deposit Being Processed'
    END,
    CASE
      WHEN p_status = 'completed' THEN
        'Your deposit of $' || v_tx.amount || ' ' || v_tx.currency || ' has been confirmed and credited to your account.'
      WHEN p_status = 'failed' THEN
        'Your ' || v_tx.type || ' of $' || v_tx.amount || ' ' || v_tx.currency || ' could not be processed.' ||
        COALESCE(' Reason: ' || p_notes, ' Please contact support.')
      WHEN p_status = 'processing' THEN
        'Your deposit of $' || v_tx.amount || ' ' || v_tx.currency || ' is being processed. Usually takes 10–30 minutes.'
    END,
    CASE
      WHEN p_status = 'completed'  THEN 'success'
      WHEN p_status = 'failed'     THEN 'error'
      ELSE 'info'
    END,
    '/transactions'
  );

  RETURN json_build_object('success', true, 'new_status', p_status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_transaction(UUID, TEXT, TEXT) TO authenticated;
