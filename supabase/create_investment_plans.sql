-- Create/Update All Investment Plans with New Structure
-- Run this in Supabase SQL Editor

-- First, let's make sure we have the correct table structure
-- (This should already exist, but just in case)

-- Clear existing plans (optional - remove this if you want to keep existing data)
-- DELETE FROM public.investment_plans;

-- Insert/Update all investment plans with new specifications
INSERT INTO public.investment_plans (
  name, 
  description, 
  risk_level, 
  min_investment, 
  max_investment, 
  expected_return_min, 
  expected_return_max, 
  duration_days, 
  is_active
) VALUES 
-- Shield Plan - 5% profit, 24 hours
(
  'Shield',
  'Low-risk entry plan for new investors. Steady, predictable returns to help you build a solid crypto foundation.',
  'conservative',
  100,
  10000,
  5,
  5,
  1,
  true
),
-- Growth Plan - 10% profit, 24 hours  
(
  'Growth',
  'Balanced portfolio targeting consistent mid-term growth through diversified crypto and DeFi positions.',
  'moderate',
  1500,
  50000,
  10,
  10,
  1,
  true
),
-- Accelerator Plan - 15% profit, 24 hours
(
  'Accelerator',
  'High-conviction positions in top-performing assets for investors ready to scale aggressively.',
  'growth',
  15000,
  200000,
  15,
  15,
  1,
  true
),
-- Alpha Plan - 20% profit, 24 hours
(
  'Alpha',
  'Premium strategy for serious capital — institutional-grade assets, deeper DeFi exposure, and outsized return potential.',
  'aggressive',
  50000,
  1000000,
  20,
  20,
  1,
  true
),
-- Enterprise Plan - 25% profit daily dividend
(
  'Enterprise',
  'Exclusive dividend plan for enterprise clients. Daily 25% profit distribution for institutional-grade portfolios.',
  'aggressive',
  100000,
  NULL,
  25,
  25,
  1,
  true
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  risk_level = EXCLUDED.risk_level,
  min_investment = EXCLUDED.min_investment,
  max_investment = EXCLUDED.max_investment,
  expected_return_min = EXCLUDED.expected_return_min,
  expected_return_max = EXCLUDED.expected_return_max,
  duration_days = EXCLUDED.duration_days,
  is_active = EXCLUDED.is_active;

-- Verify the plans were created/updated correctly
SELECT 
  name,
  risk_level,
  min_investment,
  max_investment,
  expected_return_min || '%' as profit_percentage,
  duration_days || ' day(s)' as duration,
  is_active,
  description
FROM public.investment_plans 
ORDER BY expected_return_min;

-- Show a summary
SELECT 
  'Investment Plans Summary' as info,
  COUNT(*) as total_plans,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_plans,
  MIN(expected_return_min) || '% - ' || MAX(expected_return_max) || '%' as profit_range
FROM public.investment_plans;