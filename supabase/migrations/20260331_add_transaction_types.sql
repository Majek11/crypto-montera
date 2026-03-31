-- Add missing transaction types to the enum
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'admin_deposit';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'profit';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'refund';