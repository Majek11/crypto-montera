// Script to update investment plans with correct values
// Usage: node update-plans.js

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateInvestmentPlans() {
  console.log('Updating investment plans...');
  
  const plans = [
    {
      name: 'Shield',
      expected_return_min: 5,
      expected_return_max: 5,
      duration_days: 1,
      description: 'Low-risk entry plan for new investors. Steady, predictable returns to help you build a solid crypto foundation. 5% profit in 24 hours.'
    },
    {
      name: 'Growth', 
      expected_return_min: 10,
      expected_return_max: 10,
      duration_days: 1,
      description: 'Balanced portfolio targeting consistent mid-term growth through diversified crypto and DeFi positions. 10% profit in 24 hours.'
    },
    {
      name: 'Accelerator',
      expected_return_min: 15,
      expected_return_max: 15,
      duration_days: 1,
      description: 'High-conviction positions in top-performing assets for investors ready to scale aggressively. 15% profit in 24 hours.'
    },
    {
      name: 'Alpha',
      expected_return_min: 20,
      expected_return_max: 20,
      duration_days: 1,
      description: 'Premium strategy for serious capital — institutional-grade assets, deeper DeFi exposure, and outsized return potential. 20% profit in 24 hours.'
    }
  ];

  for (const plan of plans) {
    console.log(`Updating ${plan.name}...`);
    
    const { data, error } = await supabase
      .from('investment_plans')
      .update({
        expected_return_min: plan.expected_return_min,
        expected_return_max: plan.expected_return_max,
        duration_days: plan.duration_days,
        description: plan.description
      })
      .eq('name', plan.name);
    
    if (error) {
      console.error(`Error updating ${plan.name}:`, error);
    } else {
      console.log(`✅ ${plan.name} updated successfully`);
    }
  }

  // Create Enterprise plan if it doesn't exist
  console.log('Creating/updating Enterprise plan...');
  const { data: enterpriseData, error: enterpriseError } = await supabase
    .from('investment_plans')
    .upsert({
      name: 'Enterprise',
      description: 'Exclusive dividend plan for enterprise clients. Daily 25% profit distribution for institutional-grade portfolios.',
      risk_level: 'aggressive',
      min_investment: 100000,
      max_investment: null,
      expected_return_min: 25,
      expected_return_max: 25,
      duration_days: 1,
      is_active: true
    }, { onConflict: 'name' });

  if (enterpriseError) {
    console.error('Error with Enterprise plan:', enterpriseError);
  } else {
    console.log('✅ Enterprise plan created/updated successfully');
  }

  // Verify the updates
  console.log('\nVerifying updates...');
  const { data: allPlans, error: fetchError } = await supabase
    .from('investment_plans')
    .select('name, expected_return_min, expected_return_max, duration_days')
    .order('expected_return_min');

  if (fetchError) {
    console.error('Error fetching plans:', fetchError);
  } else {
    console.log('\nCurrent investment plans:');
    allPlans.forEach(plan => {
      console.log(`${plan.name}: ${plan.expected_return_min}% profit, ${plan.duration_days} day(s)`);
    });
  }

  console.log('\nDone! Refresh your browser to see the changes.');
}

updateInvestmentPlans().catch(console.error);