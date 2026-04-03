// Script to add profit column to profiles table
// Requires Supabase service role key (not the public key)
import { createClient } from '@supabase/supabase-js';

// You need to get your service role key from:
// Supabase Dashboard → Settings → API → service_role key (secret)
const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE'; // Replace with actual key

const supabase = createClient(
  'https://qeuxyfuqpdajgfrelbiw.supabase.co',
  SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function addProfitColumn() {
  console.log('🔧 Adding profit column to profiles table...\n');
  
  try {
    // Method 1: Try using the REST API to execute SQL
    console.log('1. Attempting to add profit column via SQL...');
    
    const response = await fetch(`https://qeuxyfuqpdajgfrelbiw.supabase.co/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        sql: `
          ALTER TABLE public.profiles 
          ADD COLUMN IF NOT EXISTS profit DECIMAL(20,2) NOT NULL DEFAULT 0;
          
          UPDATE public.profiles 
          SET profit = 0 
          WHERE profit IS NULL;
        `
      })
    });
    
    if (response.ok) {
      console.log('✅ Profit column added successfully via REST API');
    } else {
      console.log('⚠️ REST API method failed, trying alternative...');
      
      // Method 2: Try direct table operations (this won't work for ALTER TABLE but let's try)
      console.log('2. Attempting to verify current schema...');
      
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('profit')
        .limit(1);
      
      if (testError && testError.code === '42703') {
        console.log('❌ Confirmed: profit column does not exist');
        console.log('❌ Cannot add column with current permissions');
        console.log('\n📋 MANUAL STEPS REQUIRED:');
        console.log('   1. Go to Supabase Dashboard → SQL Editor');
        console.log('   2. Copy and paste this SQL:');
        console.log('');
        console.log('   ALTER TABLE public.profiles');
        console.log('   ADD COLUMN IF NOT EXISTS profit DECIMAL(20,2) NOT NULL DEFAULT 0;');
        console.log('');
        console.log('   UPDATE public.profiles');
        console.log('   SET profit = 0');
        console.log('   WHERE profit IS NULL;');
        console.log('');
        console.log('   3. Run the SQL script');
        console.log('   4. Test the admin profit functionality');
        return;
      } else if (!testError) {
        console.log('✅ Profit column already exists!');
        console.log('   The admin profit functionality should work now.');
        return;
      }
    }
    
    // Verify the column was added
    console.log('\n3. Verifying profit column...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('profit')
      .limit(1);
    
    if (verifyError) {
      console.log('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ Profit column verified and working!');
      console.log('🎉 Admin profit functionality should now work correctly.');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    console.log('\n📋 Please add the profit column manually in Supabase Dashboard');
  }
}

// Check if service role key is provided
if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.log('❌ Please replace SERVICE_ROLE_KEY with your actual Supabase service role key');
  console.log('   Get it from: Supabase Dashboard → Settings → API → service_role key');
  console.log('\n   OR run this script without the service key to get manual instructions');
  
  // Provide manual instructions
  console.log('\n📋 MANUAL STEPS (if you prefer):');
  console.log('   1. Go to Supabase Dashboard → SQL Editor');
  console.log('   2. Copy and paste this SQL:');
  console.log('');
  console.log('   ALTER TABLE public.profiles');
  console.log('   ADD COLUMN IF NOT EXISTS profit DECIMAL(20,2) NOT NULL DEFAULT 0;');
  console.log('');
  console.log('   UPDATE public.profiles');
  console.log('   SET profit = 0');
  console.log('   WHERE profit IS NULL;');
  console.log('');
  console.log('   3. Run the SQL script');
  console.log('   4. Test the admin profit functionality');
} else {
  addProfitColumn();
}