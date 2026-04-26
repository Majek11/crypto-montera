-- Admin function to approve/reject withdrawal transactions
-- Copy and paste this into Supabase SQL Editor and run it

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
  v_transaction RECORD;
  v_user_balance DECIMAL;
  v_user_profit DECIMAL;
  v_total_available DECIMAL;
  v_from_balance DECIMAL := 0;
  v_from_profit DECIMAL := 0;
BEGIN
  -- Get transaction details
  SELECT * INTO v_transaction
  FROM public.transactions
  WHERE id = p_transaction_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Transaction not found');
  END IF;
  
  -- Handle withdrawal approval
  IF v_transaction.type = 'withdrawal' AND p_status = 'completed' THEN
    -- Get current user balances
    SELECT balance, profit INTO v_user_balance, v_user_profit
    FROM public.profiles
    WHERE user_id = v_transaction.user_id;
    
    v_total_available := v_user_balance + v_user_profit;
    
    -- Check if user still has sufficient funds
    IF v_transaction.amount > v_total_available THEN
      RETURN json_build_object('error', 'User has insufficient funds for withdrawal');
    END IF;
    
    -- Calculate withdrawal breakdown (balance first)
    v_from_balance := LEAST(v_transaction.amount, v_user_balance);
    v_from_profit := v_transaction.amount - v_from_balance;
    
    -- Deduct from user balances
    UPDATE public.profiles
    SET 
      balance = balance - v_from_balance,
      profit = profit - v_from_profit
    WHERE user_id = v_transaction.user_id;
    
    -- Update transaction status
    UPDATE public.transactions
    SET 
      status = p_status,
      description = description || ' (Approved: Balance: $' || v_from_balance || ', Profit: $' || v_from_profit || ')'
    WHERE id = p_transaction_id;
    
    -- Send notification to user
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      v_transaction.user_id,
      '✅ Withdrawal Approved',
      'Your withdrawal of $' || v_transaction.amount || ' has been approved and processed.' || 
      CASE WHEN p_notes IS NOT NULL THEN ' Note: ' || p_notes ELSE '' END,
      'success'
    );
    
  ELSIF v_transaction.type = 'withdrawal' AND p_status = 'failed' THEN
    -- Reject withdrawal
    UPDATE public.transactions
    SET status = p_status
    WHERE id = p_transaction_id;
    
    -- Send notification to user
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      v_transaction.user_id,
      '❌ Withdrawal Rejected',
      'Your withdrawal of $' || v_transaction.amount || ' has been rejected.' ||
      CASE WHEN p_notes IS NOT NULL THEN ' Reason: ' || p_notes ELSE '' END,
      'error'
    );
    
  ELSIF v_transaction.type = 'deposit' AND p_status = 'completed' THEN
    -- Approve deposit - credit user balance
    UPDATE public.profiles
    SET balance = balance + v_transaction.amount
    WHERE user_id = v_transaction.user_id;
    
    UPDATE public.transactions
    SET status = p_status
    WHERE id = p_transaction_id;
    
    -- Send notification to user
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      v_transaction.user_id,
      '✅ Deposit Confirmed',
      'Your deposit of $' || v_transaction.amount || ' has been confirmed and credited to your account.',
      'success'
    );
    
  ELSE
    -- General status update
    UPDATE public.transactions
    SET status = p_status
    WHERE id = p_transaction_id;
    
    -- Send notification for other status changes
    IF p_status = 'failed' THEN
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (
        v_transaction.user_id,
        '❌ Transaction Failed',
        'Your ' || v_transaction.type || ' transaction has failed.' ||
        CASE WHEN p_notes IS NOT NULL THEN ' Reason: ' || p_notes ELSE '' END,
        'error'
      );
    ELSIF p_status = 'processing' THEN
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (
        v_transaction.user_id,
        '⏳ Transaction Processing',
        'Your ' || v_transaction.type || ' transaction is now being processed.' ||
        CASE WHEN p_notes IS NOT NULL THEN ' Note: ' || p_notes ELSE '' END,
        'info'
      );
    END IF;
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$;

-- Grant execute permission to authenticated users (admin check should be done in application)
GRANT EXECUTE ON FUNCTION public.admin_update_transaction(UUID, TEXT, TEXT) TO authenticated;