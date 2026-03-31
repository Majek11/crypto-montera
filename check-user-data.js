// Check user data to see what happened to balances
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function checkUserData() {
  console.log('Checking user profiles...');
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('user_id, email, balance, profit')
    .order('balance', { ascending: false });
  
  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }
  
  console.log('\nUser Profiles:');
  profiles.forEach(profile => {
    console.log(`${profile.email}: Balance=$${profile.balance || 0}, Profit=$${profile.profit || 0}`);
  });
  
  console.log('\nChecking transactions...');
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('user_id, type, amount, status')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (txError) {
    console.error('Error fetching transactions:', txError);
    return;
  }
  
  console.log('\nRecent Transactions:');
  transactions.forEach(tx => {
    console.log(`User: ${tx.user_id}, Type: ${tx.type}, Amount: $${tx.amount}`);
  });
}

checkUserData().catch(console.error);