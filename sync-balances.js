// Script to sync user balances based on transaction history
// Usage: node sync-balances.js

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function syncUserBalances() {
  console.log('Syncing user balances based on transaction history...');
  
  // Get all users
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('user_id, email, balance, profit');
  
  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }
  
  console.log(`Found ${profiles.length} users to sync`);
  
  for (const profile of profiles) {
    console.log(`\nSyncing ${profile.email}...`);
    
    // Get all completed transactions for this user
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('type, amount, status')
      .eq('user_id', profile.user_id)
      .eq('status', 'completed');
    
    if (txError) {
      console.error(`Error fetching transactions for ${profile.email}:`, txError);
      continue;
    }
    
    // Calculate balance (deposits - investments - withdrawals)
    let calculatedBalance = 0;
    let calculatedProfit = 0;
    
    transactions.forEach(tx => {
      const amount = Number(tx.amount);
      
      switch (tx.type) {
        case 'deposit':
        case 'admin_deposit':
          calculatedBalance += amount;
          break;
        case 'investment':
        case 'withdrawal':
          calculatedBalance -= amount;
          break;
        case 'return':
        case 'profit':
          calculatedProfit += amount;
          break;
        case 'refund':
          calculatedBalance += amount;
          break;
      }
    });
    
    console.log(`  Current: Balance=$${profile.balance}, Profit=$${profile.profit}`);
    console.log(`  Calculated: Balance=$${calculatedBalance}, Profit=$${calculatedProfit}`);
    
    // Update the profile if values are different
    if (Math.abs(calculatedBalance - (profile.balance || 0)) > 0.01 || 
        Math.abs(calculatedProfit - (profile.profit || 0)) > 0.01) {
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          balance: calculatedBalance,
          profit: calculatedProfit
        })
        .eq('user_id', profile.user_id);
      
      if (updateError) {
        console.error(`  ❌ Error updating ${profile.email}:`, updateError);
      } else {
        console.log(`  ✅ Updated ${profile.email}: Balance=$${calculatedBalance}, Profit=$${calculatedProfit}`);
      }
    } else {
      console.log(`  ✓ ${profile.email} already in sync`);
    }
  }
  
  console.log('\nSync completed! Refresh your browser to see updated balances.');
}

syncUserBalances().catch(console.error);