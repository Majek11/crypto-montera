// Test script to check profit calculation
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function testProfitCalculation() {
  console.log('Testing profit calculation...');
  
  // Get all users
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('user_id, email, balance')
    .limit(5);
  
  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }
  
  for (const profile of profiles) {
    console.log(`\nChecking ${profile.email}:`);
    console.log(`  Current balance: $${profile.balance || 0}`);
    
    // Check for profit transactions
    const { data: profitTxs, error: txError } = await supabase
      .from('transactions')
      .select('type, amount, status, description')
      .eq('user_id', profile.user_id)
      .eq('status', 'completed')
      .in('type', ['return', 'profit']);
    
    if (txError) {
      console.error(`  Error fetching transactions: ${txError.message}`);
      continue;
    }
    
    const totalProfit = profitTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
    console.log(`  Profit transactions: ${profitTxs.length}`);
    console.log(`  Total profit from transactions: $${totalProfit}`);
    
    if (profitTxs.length > 0) {
      console.log('  Profit transactions:');
      profitTxs.forEach(tx => {
        console.log(`    - ${tx.type}: $${tx.amount} (${tx.description})`);
      });
    }
  }
}

testProfitCalculation().catch(console.error);