import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, AlertTriangle, Check, Shield, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { CHAINS, CURRENCIES } from "@/lib/constants";

const withdrawSchema = z.object({
  amount: z.number().min(10, "Minimum withdrawal is $10").max(1000000),
  address: z.string().trim().min(10, "Invalid wallet address").max(100),
});

const Withdraw = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedChain, setSelectedChain] = useState(CHAINS[0]);
  const [selectedCurrency, setSelectedCurrency] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"configure" | "confirm" | "submitted">("configure");
  const [availableBalance, setAvailableBalance] = useState(0);
  const [kycStatus, setKycStatus] = useState<string>("pending");
  const [kycLoading, setKycLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [
        { data: profileData },
        { data: kycData },
      ] = await Promise.all([
        supabase.from("profiles").select("balance, profit").eq("user_id", user.id).single(),
        supabase.from("kyc_verifications").select("status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      
      if (profileData) {
        // Calculate total available balance (balance + profit)
        const totalBalance = Number(profileData.balance || 0) + Number(profileData.profit || 0);
        setAvailableBalance(totalBalance);
      } else {
        setAvailableBalance(0);
      }
      
      setKycStatus((kycData as any)?.status || "pending");
      setKycLoading(false);
    };
    fetchData();
  }, [user]);

  const handleContinue = () => {
    const result = withdrawSchema.safeParse({ amount: Number(amount), address: withdrawAddress });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    if (Number(amount) > availableBalance) {
      toast.error("Insufficient balance");
      return;
    }
    setStep("confirm");
  };

  const handleSubmitWithdrawal = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      // Use the process_withdrawal function to properly deduct balance
      const { data, error } = await supabase.rpc('process_withdrawal', {
        p_user_id: user.id,
        p_amount: Number(amount),
        p_source: 'balance_first' // Deduct from balance first, then profit
      });

      if (error) {
        console.error("Withdrawal processing error:", error);
        toast.error("Failed to process withdrawal: " + error.message);
        setSubmitting(false);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        setSubmitting(false);
        return;
      }

      // Success - withdrawal was processed and balance deducted
      console.log("Withdrawal processed successfully:", data);
      toast.success(`Withdrawal of $${Number(amount).toLocaleString()} processed successfully`);
      
      setStep("submitted");
      setSubmitting(false);
      
    } catch (error) {
      console.error("Withdrawal submission error:", error);
      toast.error("Failed to submit withdrawal");
      setSubmitting(false);
    }
  };

  const fee = Number(amount) * 0.001; // 0.1% fee
  const receiveAmount = Number(amount) - fee;

  // KYC gate — must be approved before accessing withdrawal form
  if (!kycLoading && kycStatus !== "approved") {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-amber-400/30 rounded-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-400/10 flex items-center justify-center mx-auto mb-5">
              <ShieldAlert size={28} className="text-amber-400" />
            </div>
            <h2 className="font-heading font-bold text-xl text-foreground mb-2">
              KYC Verification Required
            </h2>
            <p className="font-body text-sm text-muted-foreground mb-2 max-w-sm mx-auto">
              {kycStatus === "submitted" || kycStatus === "under_review"
                ? "Your KYC documents are currently under review. Withdrawals will be unlocked once your identity is verified."
                : kycStatus === "rejected"
                  ? "Your KYC was rejected. Please resubmit with a valid government-issued ID to unlock withdrawals."
                  : "To protect our platform and comply with regulations, identity verification (KYC) is required before you can make withdrawals."}
            </p>
            {(kycStatus === "submitted" || kycStatus === "under_review") && (
              <p className="font-mono text-xs text-blue-400 mb-6">Review usually completes within 24 hours.</p>
            )}
            <div className="flex gap-3 justify-center mt-6">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
              {(kycStatus === "pending" || kycStatus === "rejected") && (
                <Button variant="hero" onClick={() => navigate("/kyc")}>
                  {kycStatus === "rejected" ? "Resubmit KYC" : "Complete KYC"}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <ArrowUpRight size={18} className="text-destructive" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-2xl text-foreground">Withdraw Funds</h1>
              <p className="font-body text-sm text-muted-foreground">Send crypto to an external wallet</p>
            </div>
          </div>
        </motion.div>

        {step === "configure" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Balance Card */}
            <div className="bg-card border border-border rounded-lg p-5">
              <p className="font-body text-xs text-muted-foreground mb-1">Available Balance</p>
              <p className="font-mono text-2xl font-medium text-foreground">
                ${availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Chain Selection */}
            <div className="bg-card border border-border rounded-lg p-5">
              <Label className="font-body text-sm text-muted-foreground mb-3 block">Select Network</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CHAINS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedChain(c)}
                    className={`p-3 rounded-lg border text-left transition-all ${selectedChain.id === c.id
                      ? "border-primary bg-accent-dim"
                      : "border-border hover:border-border-light bg-secondary"
                      }`}
                  >
                    <p className="font-body text-sm font-medium text-foreground">{c.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{c.symbol}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount + Address */}
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <div>
                <div className="flex justify-between">
                  <Label className="font-body text-sm text-muted-foreground">Amount</Label>
                  <button onClick={() => setAmount(availableBalance.toString())} className="font-mono text-xs text-primary hover:underline">Max</button>
                </div>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-input border-border text-foreground font-mono text-lg flex-1"
                    min="10"
                  />
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="w-24 h-10 px-3 rounded-md bg-input border border-border text-foreground text-sm font-mono"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label className="font-body text-sm text-muted-foreground">Withdrawal Address</Label>
                <Input
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder="Enter destination wallet address"
                  className="mt-1.5 bg-input border-border text-foreground font-mono text-sm"
                />
              </div>

              {Number(amount) > 0 && (
                <div className="bg-secondary rounded-lg p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-body text-xs text-muted-foreground">Network Fee (0.1%)</span>
                    <span className="font-mono text-xs text-muted-foreground">{fee.toFixed(4)} {selectedCurrency}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/30 pt-2">
                    <span className="font-body text-xs text-foreground font-medium">You Receive</span>
                    <span className="font-mono text-sm text-primary font-medium">{receiveAmount.toFixed(4)} {selectedCurrency}</span>
                  </div>
                </div>
              )}
            </div>

            <Button variant="hero" className="w-full py-6 text-base" onClick={handleContinue} disabled={!amount || !withdrawAddress}>
              Continue
            </Button>
          </motion.div>
        )}

        {step === "confirm" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="font-heading font-bold text-lg text-foreground mb-4">Confirm Withdrawal</h2>
              <div className="space-y-3">
                {[
                  { label: "Amount", value: `${Number(amount).toLocaleString()} ${selectedCurrency}` },
                  { label: "Fee", value: `${fee.toFixed(4)} ${selectedCurrency}` },
                  { label: "You Receive", value: `${receiveAmount.toFixed(4)} ${selectedCurrency}`, highlight: true },
                  { label: "Network", value: selectedChain.name },
                  { label: "To Address", value: `${withdrawAddress.slice(0, 12)}...${withdrawAddress.slice(-8)}` },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-border/30 last:border-0">
                    <span className="font-body text-sm text-muted-foreground">{item.label}</span>
                    <span className={`font-mono text-sm ${item.highlight ? "text-primary font-medium" : "text-foreground"}`}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 mt-4 flex gap-2">
                <AlertTriangle size={16} className="text-destructive flex-shrink-0 mt-0.5" />
                <p className="font-body text-xs text-destructive">
                  Withdrawals are irreversible. Please double-check the address and network. Sending to the wrong address or network will result in permanent loss of funds.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 py-6" onClick={() => setStep("configure")}>Back</Button>
              <Button variant="hero" className="flex-1 py-6" onClick={handleSubmitWithdrawal} disabled={submitting}>
                {submitting ? "Submitting..." : "Confirm Withdrawal"}
              </Button>
            </div>
          </motion.div>
        )}

        {step === "submitted" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-accent-dim flex items-center justify-center mx-auto mb-4">
              <Shield size={28} className="text-primary" />
            </div>
            <h2 className="font-heading font-bold text-xl text-foreground mb-2">Withdrawal Submitted</h2>
            <p className="font-body text-sm text-muted-foreground mb-6">
              Your withdrawal of <span className="text-primary font-medium">{receiveAmount.toFixed(4)} {selectedCurrency}</span> has been processed successfully. The funds have been deducted from your account.
            </p>

            {/* Status Tracker */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {["Submitted", "Processed", "Completed"].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold ${i <= 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}>
                    {i < 2 ? <Check size={14} /> : i + 1}
                  </div>
                  <span className={`font-body text-[10px] sm:text-xs ${i <= 1 ? "text-primary" : "text-muted-foreground"}`}>{s}</span>
                  {i < 2 && <div className="w-4 sm:w-8 h-px bg-border" />}
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/transactions")}>View Transactions</Button>
              <Button variant="hero" onClick={() => { setStep("configure"); setAmount(""); setWithdrawAddress(""); }}>New Withdrawal</Button>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default Withdraw;
