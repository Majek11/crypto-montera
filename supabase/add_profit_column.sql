-- Add profit column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profit DECIMAL(20,2) NOT NULL DEFAULT 0;

-- Update existing profiles to have profit = 0
UPDATE public.profiles SET profit = 0 WHERE profit IS NULL;