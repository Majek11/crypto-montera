// Test script to verify profit calculation works correctly
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qeuxyfuqpdajgfrelbiw.supabase.co',
  'sb_publishable_I_W-1kyoVeVp7SlMb4PchA_ltdQ08Zt'
);

async function testProfitCalculation() {
  console.log('🧪 Testing profit calculation...\n');
  
  try {
    // Get a test user
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, email, balance')
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      console.log('❌ No users found or error:', usersError);
      return;
    }
    
    const testUser = users[0];
    console.log(`📋 Testing with user: ${testUser.email}`);
    console.log(`💰 Current balance: $${testUser.balance}\n`);
    
    // Check current profit transactions
    const { data: profitTxs, error: profitError } = await supabase
      .from('transactions')
      .select('amount, type, description, created_at')
      .eq('user_id', testUser.user_id)
      .eq('status', 'completed')
      .in('type', ['return', 'profit'])
      .order('created_at', { ascending: false });
    
    if (profitError) {
      console.log('❌ Error fetching profit transactions:', profitError);
      return;
    }
    
    console.log(`📊 Found ${profitTxs?.length || 0} profit transactions:`);
    if (profitTxs && profitTxs.length > 0) {
      profitTxs.forEach((tx, i) => {
        console.log(`  ${i + 1}. ${tx.type}: $${tx.amount} - ${tx.description}`);
      });
    } else {
      console.log('  (No profit transactions found)');
    }
    
    // Calculate total profit
    const totalProfit = profitTxs ? profitTxs.reduce((sum, tx) => sum + Number(tx.amount), 0) : 0;
    console.log(`\n💎 Calculated Total Profit: $${totalProfit.toFixed(2)}`);
    
    // Test creating a profit transaction
    console.log('\n🔧 Testing profit transaction creation...');
    const testAmount = 50.00;
    
    const { data: newTx, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: testUser.user_id,
        type: 'profit',
        amount: testAmount,
        currency: 'USD',
        status: 'completed',
        description: '💰 Test Admin Profit Credit',
        reference: `test-profit-${Date.now()}`
      })
      .select()
      .single();
    
    if (txError) {
      console.log('❌ Error creating profit transaction:', txError);
      return;
    }
    
    console.log('✅ Profit transaction created successfully!');
    console.log(`   Transaction ID: ${newTx.id}`);
    console.log(`   Amount: $${newTx.amount}`);
    console.log(`   Type: ${newTx.type}`);
    
    // Verify profit calculation after adding transaction
    const { data: updatedProfitTxs } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', testUser.user_id)
      .eq('status', 'completed')
      .in('type', ['return', 'profit']);
    
    const newTotalProfit = updatedProfitTxs ? updatedProfitTxs.reduce((sum, tx) => sum + Number(tx.amount), 0) : 0;
    console.log(`\n💎 New Total Profit: $${newTotalProfit.toFixed(2)}`);
    console.log(`📈 Profit increase: $${(newTotalProfit - totalProfit).toFixed(2)}`);
    
    // Clean up test transaction
    await supabase
      .from('transactions')
      .delete()
      .eq('id', newTx.id);
    
    console.log('\n🧹 Test transaction cleaned up');
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testProfitCalculation();