import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowDownLeft, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import type { Wallet } from "@/types";
import { CHAINS, CURRENCIES } from "@/lib/constants";

const depositSchema = z.object({
  amount: z.number().min(10, "Minimum deposit is $10").max(1000000, "Maximum deposit is $1,000,000"),
});

const Deposit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedChain, setSelectedChain] = useState(CHAINS[0]);
  const [selectedCurrency, setSelectedCurrency] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"configure" | "confirm" | "submitted">("configure");

  useEffect(() => {
    if (!user) return;
    const fetchWallets = async () => {
      const { data, error } = await supabase.from("wallets").select("*").eq("user_id", user.id).order("is_primary", { ascending: false });
      if (error) { toast.error("Failed to load wallets"); return; }
      if (data && data.length > 0) {
        setWallets(data);
        setSelectedWallet(data[0]);
      }
    };
    fetchWallets();
  }, [user]);

  const depositAddress = selectedWallet?.address || "No wallet connected";

  const copyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = () => {
    const result = depositSchema.safeParse({ amount: Number(amount) });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    if (!selectedWallet) {
      toast.error("Please add a wallet first");
      return;
    }
    setStep("confirm");
  };

  const handleSubmitDeposit = async () => {
    if (!user || !selectedWallet) return;
    setSubmitting(true);

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "deposit" as const,
      amount: Number(amount),
      currency: selectedCurrency,
      status: "pending" as const,
      wallet_id: selectedWallet.id,
      description: `${selectedCurrency} deposit via ${selectedChain.name}`,
    });

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
    } else {
      setStep("submitted");
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center">
              <ArrowDownLeft size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-2xl text-foreground">Deposit Funds</h1>
              <p className="font-body text-sm text-muted-foreground">Send crypto to your Monetra wallet</p>
            </div>
          </div>
        </motion.div>

        {step === "configure" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
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

            {/* Amount + Currency */}
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <div>
                <Label className="font-body text-sm text-muted-foreground">Amount</Label>
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

              {/* Wallet Selection */}
              {wallets.length > 0 && (
                <div>
                  <Label className="font-body text-sm text-muted-foreground">Receiving Wallet</Label>
                  <select
                    value={selectedWallet?.id || ""}
                    onChange={(e) => setSelectedWallet(wallets.find((w) => w.id === e.target.value))}
                    className="mt-1.5 w-full h-10 px-3 rounded-md bg-input border border-border text-foreground text-sm font-body"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label || "Unnamed"} ({w.chain}) — {w.address.slice(0, 8)}...
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {wallets.length === 0 && (
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <p className="font-body text-sm text-muted-foreground mb-2">No wallets connected</p>
                  <Button variant="outline" size="sm" onClick={() => navigate("/wallets")}>
                    Add Wallet
                  </Button>
                </div>
              )}
            </div>

            {/* Deposit Address + QR */}
            {selectedWallet && (
              <div className="bg-card border border-border rounded-lg p-5">
                <Label className="font-body text-sm text-muted-foreground mb-3 block">Deposit Address</Label>
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-xl">
                    <QRCodeSVG value={depositAddress} size={160} level="H" />
                  </div>
                  <div className="w-full flex items-center gap-2 bg-secondary rounded-lg px-4 py-3">
                    <p className="font-mono text-xs text-foreground flex-1 break-all">{depositAddress}</p>
                    <button onClick={copyAddress} className="p-2 rounded-lg hover:bg-card transition-colors text-muted-foreground hover:text-foreground flex-shrink-0">
                      {copied ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="font-body text-xs text-muted-foreground text-center">
                    Only send <span className="text-primary font-medium">{selectedCurrency}</span> on the <span className="text-primary font-medium">{selectedChain.name}</span> network to this address
                  </p>
                </div>
              </div>
            )}

            <Button variant="hero" className="w-full py-6 text-base" onClick={handleContinue} disabled={!amount || !selectedWallet}>
              Continue
            </Button>
          </motion.div>
        )}

        {step === "confirm" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="font-heading font-bold text-lg text-foreground mb-4">Confirm Deposit</h2>
              <div className="space-y-3">
                {[
                  { label: "Amount", value: `${Number(amount).toLocaleString()} ${selectedCurrency}` },
                  { label: "Network", value: selectedChain.name },
                  { label: "Wallet", value: selectedWallet?.label || "Unnamed" },
                  { label: "Address", value: `${depositAddress.slice(0, 12)}...${depositAddress.slice(-8)}` },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-border/30 last:border-0">
                    <span className="font-body text-sm text-muted-foreground">{item.label}</span>
                    <span className="font-mono text-sm text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-amber-400/5 border border-amber-400/20 rounded-lg p-3 mt-4">
                <p className="font-body text-xs text-amber-400">
                  ⚠️ Please ensure you've sent the exact amount to the displayed address before confirming. Deposits are subject to review.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 py-6" onClick={() => setStep("configure")}>Back</Button>
              <Button variant="hero" className="flex-1 py-6" onClick={handleSubmitDeposit} disabled={submitting}>
                {submitting ? "Submitting..." : "I've Sent the Funds"}
              </Button>
            </div>
          </motion.div>
        )}

        {step === "submitted" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-accent-dim flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-primary" />
            </div>
            <h2 className="font-heading font-bold text-xl text-foreground mb-2">Deposit Submitted</h2>
            <p className="font-body text-sm text-muted-foreground mb-6">
              Your deposit of <span className="text-primary font-medium">{Number(amount).toLocaleString()} {selectedCurrency}</span> is being reviewed. You'll be notified once it's confirmed.
            </p>

            {/* Status Tracker */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {["Submitted", "Processing", "Confirmed"].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold ${i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}>
                    {i + 1}
                  </div>
                  <span className={`font-body text-xs ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>{s}</span>
                  {i < 2 && <div className="w-8 h-px bg-border" />}
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/transactions")}>View Transactions</Button>
              <Button variant="hero" onClick={() => { setStep("configure"); setAmount(""); }}>New Deposit</Button>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout >
  );
};

export default Deposit;
