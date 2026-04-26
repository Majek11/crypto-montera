-- Add process_withdrawal function to handle withdrawals properly
-- Copy and paste this into Supabase SQL Editor and run it

CREATE OR REPLACE FUNCTION public.process_withdrawal(
  p_user_id UUID,
  p_amount DECIMAL,
  p_source TEXT DEFAULT 'balance_first' -- 'balance_first', 'profit_first'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  v_balance DECIMAL;
  v_profit DECIMAL;
  v_total_available DECIMAL;
  v_from_balance DECIMAL := 0;
  v_from_profit DECIMAL := 0;
BEGIN
  -- Get current balances
  SELECT balance, profit INTO v_balance, v_profit 
  FROM public.profiles 
  WHERE user_id = p_user_id;

  v_total_available := v_balance + v_profit;

  -- Check if sufficient funds
  IF p_amount > v_total_available THEN
    RETURN json_build_object(
      'error', 
      'Insufficient funds. Available: $' || ROUND(v_total_available, 2)
    );
  END IF;

  -- Calculate withdrawal breakdown based on source preference
  IF p_source = 'balance_first' THEN
    v_from_balance := LEAST(p_amount, v_balance);
    v_from_profit := p_amount - v_from_balance;
  ELSIF p_source = 'profit_first' THEN
    v_from_profit := LEAST(p_amount, v_profit);
    v_from_balance := p_amount - v_from_profit;
  END IF;

  -- Update balances
  UPDATE public.profiles 
  SET 
    balance = balance - v_from_balance,
    profit = profit - v_from_profit
  WHERE user_id = p_user_id;

  -- Create withdrawal transaction
  INSERT INTO public.transactions (user_id, type, amount, currency, status, description)
  VALUES (
    p_user_id, 
    'withdrawal', 
    p_amount, 
    'USD', 
    'completed', 
    'Withdrawal processed (Balance: $' || v_from_balance || ', Profit: $' || v_from_profit || ')'
  );

  RETURN json_build_object(
    'success', true,
    'amount', p_amount,
    'from_balance', v_from_balance,
    'from_profit', v_from_profit
  );
END;
$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.process_withdrawal(UUID, DECIMAL, TEXT) TO authenticated;

-- Verify the function was created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'process_withdrawal' AND routine_schema = 'public';