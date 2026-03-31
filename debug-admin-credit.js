// Debug script to test admin credit functionality
// Run this in browser console on the admin users page

// Test function to add profit
async function testAddProfit(userId, amount) {
  console.log('Testing profit addition...');
  
  try {
    // Test transaction creation
    const { data: txData, error: txError } = await supabase.from("transactions").insert({
      user_id: userId,
      type: 'return',
      amount: amount,
      currency: "USD",
      status: "completed",
      description: "💰 Test Admin Profit Credit",
      reference: `test-profit-${Date.now()}`,
    }).select().single();

    if (txError) {
      console.error("Transaction creation failed:", txError);
      return { success: false, error: txError };
    }

    console.log("Transaction created:", txData);

    // Test profile update (try profit column first)
    const { error: profitError } = await supabase
      .from("profiles")
      .update({ profit: 100 }) // Test with fixed amount
      .eq("user_id", userId);

    if (profitError && profitError.code === '42703') {
      console.log("Profit column doesn't exist, trying balance update...");
      
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ balance: supabase.raw('balance + ?', [amount]) })
        .eq("user_id", userId);
      
      if (balanceError) {
        console.error("Balance update failed:", balanceError);
        return { success: false, error: balanceError };
      }
      
      console.log("Successfully added to balance");
      return { success: true, method: 'balance' };
    } else if (profitError) {
      console.error("Profit update failed:", profitError);
      return { success: false, error: profitError };
    } else {
      console.log("Successfully added to profit");
      return { success: true, method: 'profit' };
    }
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error };
  }
}

// Usage: testAddProfit('user-id-here', 10)
console.log('Debug script loaded. Use: testAddProfit("user-id", amount)');