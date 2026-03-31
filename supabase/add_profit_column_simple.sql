-- Add profit column to profiles table
-- Run this in Supabase SQL Editor

-- Add the profit column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profit DECIMAL(20,2) NOT NULL DEFAULT 0;

-- Initialize profit to 0 for all existing users
UPDATE public.profiles 
SET profit = 0 
WHERE profit IS NULL;

-- Verify the column was added
SELECT user_id, email, balance, profit 
FROM public.profiles 
LIMIT 5;