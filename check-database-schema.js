// Check what columns actually exist in the profiles table
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qeuxyfuqpdajgfrelbiw.supabase.co',
  'sb_publishable_I_W-1kyoVeVp7SlMb4PchA_ltdQ08Zt'
);

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema...\n');
  
  try {
    // Try to get the first profile to see what columns exist
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accessing profiles table:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Profiles table columns:');
      const columns = Object.keys(data[0]);
      columns.forEach((col, i) => {
        console.log(`  ${i + 1}. ${col}: ${typeof data[0][col]} (${data[0][col]})`);
      });
      
      console.log('\n📊 Column Analysis:');
      console.log(`   - Has 'balance' column: ${columns.includes('balance') ? '✅ YES' : '❌ NO'}`);
      console.log(`   - Has 'profit' column: ${columns.includes('profit') ? '✅ YES' : '❌ NO'}`);
      
    } else {
      console.log('⚠️ No profiles found in database');
    }
    
    // Also check transaction types
    console.log('\n🔍 Checking transaction types...');
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('type')
      .limit(10);
    
    if (txError) {
      console.log('❌ Error accessing transactions:', txError);
    } else if (txData) {
      const types = [...new Set(txData.map(tx => tx.type))];
      console.log('✅ Found transaction types:', types);
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

checkDatabaseSchema();