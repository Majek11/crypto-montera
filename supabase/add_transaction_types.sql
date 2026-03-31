-- =============================================
-- ADD MISSING TRANSACTION TYPES
-- Run this in Supabase SQL Editor
-- =============================================

-- Add missing transaction types to the enum
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'admin_deposit';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'profit';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'refund';

-- Verify the enum now includes all required types
-- Expected: 'deposit', 'withdrawal', 'investment', 'return', 'fee', 'admin_deposit', 'profit', 'refund'