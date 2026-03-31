// This is the fixed handleCreditWallet function
// Copy this into AdminUsers.tsx to replace the existing function

const handleCreditWallet = async () => {
  if (!creditDialog.user || !creditAmount || isNaN(Number(creditAmount)) || Number(creditAmount) <= 0) {
    toast.error("Please enter a valid amount");
    return;
  }
  setCreditSubmitting(true);
  const amountNum = Number(creditAmount);
  const isProfit = creditDialog.type === 'profit';
  const transactionType = isProfit ? 'return' : 'deposit';
  const description = creditNote.trim() || (isProfit ? "💰 Admin Profit Credit" : "💳 Admin Balance Credit");

  try {
    console.log(`Adding ${isProfit ? 'profit' : 'balance'}: $${amountNum} to user ${creditDialog.user.email}`);
    
    // Step 1: Insert transaction first
    const { data: txData, error: txError } = await supabase.from("transactions").insert({
      user_id: creditDialog.user.user_id,
      type: transactionType,
      amount: amountNum,
      currency: "USD",
      status: "completed",
      description,
      reference: `admin-${isProfit ? 'profit' : 'deposit'}-${Date.now()}`,
    }).select().single();

    if (txError) {
      console.error("Transaction error:", txError);
      toast.error("Failed to create transaction: " + txError.message);
      setCreditSubmitting(false);
      return;
    }

    console.log("Transaction created:", txData);

    // Step 2: Update profile balance/profit
    if (isProfit) {
      // Try to update profit column first
      const { error: profitError } = await supabase
        .from("profiles")
        .update({ profit: (creditUserProfit ?? 0) + amountNum })
        .eq("user_id", creditDialog.user.user_id);

      if (profitError && profitError.code === '42703') {
        // Profit column doesn't exist, add to balance but transaction is still 'return' type
        console.log("Profit column doesn't exist, adding to balance instead");
        const { error: balanceError } = await supabase
          .from("profiles")
          .update({ balance: (creditUserBalance ?? 0) + amountNum })
          .eq("user_id", creditDialog.user.user_id);
        
        if (balanceError) {
          console.error("Balance update error:", balanceError);
          toast.error("Failed to update balance: " + balanceError.message);
          setCreditSubmitting(false);
          return;
        }
        
        toast.success(`${amountNum.toLocaleString("en-US", { minimumFractionDigits: 2 })} profit added (stored in balance until profit column is set up)`);
      } else if (profitError) {
        console.error("Profit update error:", profitError);
        toast.error("Failed to update profit: " + profitError.message);
        setCreditSubmitting(false);
        return;
      } else {
        console.log("Profit updated successfully");
        toast.success(`${amountNum.toLocaleString("en-US", { minimumFractionDigits: 2 })} profit added to ${creditDialog.user.display_name || creditDialog.user.email}`);
      }
    } else {
      // Update balance
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ balance: (creditUserBalance ?? 0) + amountNum })
        .eq("user_id", creditDialog.user.user_id);
      
      if (balanceError) {
        console.error("Balance update error:", balanceError);
        toast.error("Failed to update balance: " + balanceError.message);
        setCreditSubmitting(false);
        return;
      }
      
      console.log("Balance updated successfully");
      toast.success(`${amountNum.toLocaleString("en-US", { minimumFractionDigits: 2 })} balance credited to ${creditDialog.user.display_name || creditDialog.user.email}`);
    }

    // Step 3: Send notification
    await supabase.from("notifications").insert({
      user_id: creditDialog.user.user_id,
      title: isProfit ? "💰 Profit Added" : "💳 Balance Credited",
      message: `${amountNum.toLocaleString("en-US", { minimumFractionDigits: 2 })} has been ${isProfit ? 'added to your profit' : 'credited to your balance'}.${creditNote.trim() ? ` Note: ${creditNote.trim()}` : ""}`,
      type: "success",
    });

    setCreditDialog({ open: false, user: null, type: 'balance' });
    fetchUsers();
    setCreditSubmitting(false);
    
  } catch (error) {
    console.error("Unexpected error:", error);
    toast.error("Failed to credit wallet: " + (error as any).message);
    setCreditSubmitting(false);
  }
};