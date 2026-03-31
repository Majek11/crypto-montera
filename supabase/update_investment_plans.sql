-- Update Investment Plans with New Profit Percentages and 24-Hour Duration
-- Run this in Supabase SQL Editor

-- Update Shield Plan (Conservative)
UPDATE public.investment_plans 
SET 
  expected_return_min = 5,
  expected_return_max = 5,
  duration_days = 1,
  description = 'Low-risk entry plan for new investors. Steady, predictable returns to help you build a solid crypto foundation. 5% profit in 24 hours.'
WHERE name = 'Shield' OR risk_level = 'conservative';

-- Update Growth Plan (Moderate) 
UPDATE public.investment_plans 
SET 
  expected_return_min = 10,
  expected_return_max = 10,
  duration_days = 1,
  description = 'Balanced portfolio targeting consistent mid-term growth through diversified crypto and DeFi positions. 10% profit in 24 hours.'
WHERE name = 'Growth' OR risk_level = 'moderate';

-- Update Accelerator Plan (Growth)
UPDATE public.investment_plans 
SET 
  expected_return_min = 15,
  expected_return_max = 15,
  duration_days = 1,
  description = 'High-conviction positions in top-performing assets for investors ready to scale aggressively. 15% profit in 24 hours.'
WHERE name = 'Accelerator' OR risk_level = 'growth';

-- Update Alpha Plan (Aggressive)
UPDATE public.investment_plans 
SET 
  expected_return_min = 20,
  expected_return_max = 20,
  duration_days = 1,
  description = 'Premium strategy for serious capital — institutional-grade assets, deeper DeFi exposure, and outsized return potential. 20% profit in 24 hours.'
WHERE name = 'Alpha' OR risk_level = 'aggressive';

-- Create or Update Enterprise Plan (if it doesn't exist)
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
) VALUES (
  'Enterprise',
  'Exclusive dividend plan for enterprise clients. Daily 25% profit distribution for institutional-grade portfolios.',
  'aggressive',
  100000, -- $100,000 minimum for enterprise
  NULL, -- No maximum limit
  25,
  25,
  1, -- 24 hours (1 day)
  true
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  expected_return_min = EXCLUDED.expected_return_min,
  expected_return_max = EXCLUDED.expected_return_max,
  duration_days = EXCLUDED.duration_days,
  min_investment = EXCLUDED.min_investment;

-- Verify the updates
SELECT 
  name,
  risk_level,
  min_investment,
  max_investment,
  expected_return_min,
  expected_return_max,
  duration_days,
  is_active,
  description
FROM public.investment_plans 
ORDER BY expected_return_min;