-- Fix existing users who might have lost their balance data
-- Run this in Supabase SQL Editor

-- First, let's check if users have balance = 0 but have transaction history
-- This will help us identify users who need their balances restored

-- Option 1: If users had deposits that should be in their balance
-- Update balance based on completed deposit transactions
UPDATE public.profiles 
SET balance = COALESCE((
  SELECT SUM(amount) 
  FROM public.transactions 
  WHERE user_id = profiles.user_id 
    AND type IN ('deposit', 'admin_deposit') 
    AND status = 'completed'
), 0) - COALESCE((
  SELECT SUM(amount) 
  FROM public.transactions 
  WHERE user_id = profiles.user_id 
    AND type = 'investment' 
    AND status = 'completed'
), 0) - COALESCE((
  SELECT SUM(amount) 
  FROM public.transactions 
  WHERE user_id = profiles.user_id 
    AND type = 'withdrawal' 
    AND status = 'completed'
), 0)
WHERE balance = 0 OR balance IS NULL;

-- Option 2: Initialize profit column to 0 for all users if it's NULL
UPDATE public.profiles 
SET profit = 0 
WHERE profit IS NULL;

-- Option 3: If users had investment returns that should be in profit
UPDATE public.profiles 
SET profit = COALESCE((
  SELECT SUM(amount) 
  FROM public.transactions 
  WHERE user_id = profiles.user_id 
    AND type = 'return' 
    AND status = 'completed'
), 0)
WHERE profit = 0 OR profit IS NULL;

-- Verify the updates
SELECT 
  user_id,
  email,
  balance,
  profit,
  (balance + profit) as total_value
FROM public.profiles 
WHERE balance > 0 OR profit > 0
ORDER BY (balance + profit) DESC;