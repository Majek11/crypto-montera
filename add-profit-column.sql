-- Add profit column to profiles table
-- Copy and paste this into Supabase SQL Editor and run it

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profit DECIMAL(20,2) NOT NULL DEFAULT 0;

-- Update all existing users to have profit = 0
UPDATE public.profiles 
SET profit = 0 
WHERE profit IS NULL;

-- Verify the column exists
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'profit';