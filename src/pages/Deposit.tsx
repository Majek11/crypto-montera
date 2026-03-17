import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownLeft, Copy, Check, AlertCircle, Info, ArrowRight, Upload, ImageIcon, CheckCircle2, TrendingUp, Mail, Shield, TriangleAlert } from "lucide-react";
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
import { CHAINS, CURRENCIES, PLATFORM_DEPOSIT_ADDRESSES, ENTERPRISE_THRESHOLD, ENTERPRISE_EMAIL } from "@/lib/constants";
import SEO from "@/components/SEO";

const depositSchema = z.object({
  amount: z.number().min(10, "Minimum deposit is $10").max(1000000, "Maximum deposit is $1,000,000"),
});

// ─── Per-network safety warnings ─────────────────────────────────────────────
type WarnLevel = "info" | "caution" | "danger";
interface ChainWarning { level: WarnLevel; title: string; lines: string[] }

const CHAIN_WARNINGS: Record<string, ChainWarning> = {
  ethereum: {
    level: "info",
    title: "Ethereum (ERC-20) network only",
    lines: [
      "Only send ETH or ERC-20 tokens (USDC, DAI…) to this address.",
      "Do NOT send BEP-20, TRC-20 or any other network's tokens — they will be lost permanently.",
    ],
  },
  bitcoin: {
    level: "info",
    title: "Bitcoin network only",
    lines: [
      "Only send native BTC to this address.",
      "This address does NOT accept ETH, USDT, or any other asset — Bitcoin only.",
    ],
  },
  usdt_trc20: {
    level: "danger",
    title: "⚠️ TRC-20 (Tron) USDT ONLY — read carefully",
    lines: [
      "This address ONLY accepts USDT sent via the TRC-20 (Tron) network.",
      "Do NOT send ERC-20 USDT (Ethereum) or BEP-20 USDT (BSC) here.",
      "Sending the wrong USDT variant will result in permanent, unrecoverable loss of funds.",
    ],
  },
  solana: {
    level: "info",
    title: "Solana network only",
    lines: [
      "Only send SOL or Solana SPL tokens to this address.",
      "Do NOT send ETH, BNB, or tokens from any other network.",
    ],
  },
  bsc: {
    level: "caution",
    title: "BNB Smart Chain (BEP-20) — not Ethereum",
    lines: [
      "Only send BNB or BEP-20 tokens to this address.",
      "BSC and Ethereum addresses look identical but are different networks.",
      "Sending ERC-20 tokens to this BSC address will result in permanent loss.",
    ],
  },
};

const warnStyles: Record<WarnLevel, { wrap: string; icon: string; dot: string }> = {
  info: { wrap: "bg-accent-dim/30 border-primary/15", icon: "text-primary", dot: "bg-primary" },
  caution: { wrap: "bg-amber-400/10 border-amber-400/25", icon: "text-amber-400", dot: "bg-amber-400" },
  danger: { wrap: "bg-destructive/10 border-destructive/30", icon: "text-destructive", dot: "bg-destructive" },
};

const riskColors: Record<string, string> = {
  conservative: "text-blue-400 bg-blue-400/10",
  moderate: "text-primary bg-accent-dim",
  growth: "text-amber-400 bg-amber-400/10",
  aggressive: "text-destructive bg-destructive/10",
};

const Deposit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedChain, setSelectedChain] = useState(CHAINS[0]);
  const [selectedCurrency, setSelectedCurrency] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"configure" | "confirm" | "submitted">("configure");
  const [createdTxId, setCreatedTxId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  // Live wallet addresses — fetched from Supabase platform_settings, falls back to constants
  const [liveAddresses, setLiveAddresses] = useState<Record<string, string>>(PLATFORM_DEPOSIT_ADDRESSES);

  useEffect(() => {
    // Fetch investment plans
    supabase.from("investment_plans")
      .select("id, name, min_investment, expected_return_min, expected_return_max, duration_days, risk_level")
      .eq("is_active", true)
      .order("min_investment")
      .then(({ data }) => { if (data) setPlans(data); });

    // Fetch live wallet addresses from platform_settings (admin-editable)
    (supabase as any)
      .from("platform_settings")
      .select("key, value")
      .like("key", "wallet_%")
      .then(({ data }: { data: Array<{ key: string; value: string }> | null }) => {
        if (data && data.length > 0) {
          const map: Record<string, string> = {};
          data.forEach((row) => { map[row.key.replace("wallet_", "")] = row.value; });
          setLiveAddresses((prev) => ({ ...prev, ...map }));
        }
      })
      .catch(() => { /* table may not exist yet — constants fallback stays */ });
  }, []);

  const platformAddress = liveAddresses[selectedChain.id] || "Address not configured";

  const copyAddress = () => {
    navigator.clipboard.writeText(platformAddress);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = () => {
    const result = depositSchema.safeParse({ amount: Number(amount) });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    setStep("confirm");
  };

  const handleSubmitDeposit = async () => {
    if (!user) return;
    setSubmitting(true);

    const { data, error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "deposit" as const,
      amount: Number(amount),
      currency: selectedCurrency,
      network: selectedChain.id,
      status: "pending" as const,
      tx_hash: txHash || null,
      description: `${selectedCurrency} deposit via ${selectedChain.name} — sent to Montera wallet`,
    }).select("id").single();

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
    } else {
      setCreatedTxId(data?.id || null);
      setStep("submitted");
      setSubmitting(false);
    }
  };

  const handleReceiptUpload = async () => {
    if (!receipt || !createdTxId || !user) return;
    setUploadingReceipt(true);

    const ext = receipt.name.split(".").pop();
    const filePath = `${user.id}/${createdTxId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(filePath, receipt, { upsert: true });

    if (uploadError) {
      toast.error("Failed to upload receipt: " + uploadError.message);
      setUploadingReceipt(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(filePath);

    await (supabase.from("transactions") as any)
      .update({ receipt_url: urlData.publicUrl })
      .eq("id", createdTxId);

    setReceiptUploaded(true);
    setUploadingReceipt(false);
    toast.success("Receipt uploaded! Admin will process your deposit faster.");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File too large. Max 5MB."); return; }
    setReceipt(file);
    setReceiptPreview(URL.createObjectURL(file));
  };

  return (
    <AppLayout>
      <SEO title="Deposit Funds" description="Add funds to your Montera investment account securely." noIndex />
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center">
              <ArrowDownLeft size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-2xl text-foreground">Deposit Funds</h1>
              <p className="font-body text-sm text-muted-foreground">Send crypto to Montera's secure wallet</p>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "configure" && (
            <motion.div key="configure" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">

              {/* Network Selection */}
              <div className="bg-card border border-border rounded-lg p-5">
                <Label className="font-body text-sm text-muted-foreground mb-3 block">1. Select Network</Label>
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

              {/* Platform Deposit Address + QR */}
              <div className="bg-card border border-primary/20 rounded-lg p-5">
                <Label className="font-body text-sm text-muted-foreground mb-3 block">2. Send to This Address</Label>
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <QRCodeSVG value={platformAddress} size={160} level="H" />
                  </div>
                  <div className="w-full flex items-center gap-2 bg-secondary rounded-lg px-4 py-3 border border-border">
                    <p className="font-mono text-xs text-foreground flex-1 break-all">{platformAddress}</p>
                    <button
                      onClick={copyAddress}
                      className="p-2 rounded-lg hover:bg-card transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                    >
                      {copied ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                    </button>
                  </div>
                  {/* Dynamic chain-specific warning */}
                  {(() => {
                    const warn = CHAIN_WARNINGS[selectedChain.id];
                    if (!warn) return null;
                    const s = warnStyles[warn.level];
                    const WarnIcon = warn.level === "danger" ? TriangleAlert : warn.level === "caution" ? TriangleAlert : Info;
                    return (
                      <div className={`w-full border rounded-lg px-4 py-3 flex gap-2.5 ${s.wrap}`}>
                        <WarnIcon size={15} className={`${s.icon} flex-shrink-0 mt-0.5`} />
                        <div>
                          <p className={`font-body text-xs font-semibold mb-1 ${s.icon}`}>{warn.title}</p>
                          <ul className="space-y-0.5">
                            {warn.lines.map((line, i) => (
                              <li key={i} className="font-body text-xs text-muted-foreground flex gap-1.5">
                                <span className={`w-1 h-1 rounded-full ${s.dot} shrink-0 mt-1.5`} />
                                {line}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Amount + Currency + TX Hash */}
              <div className="bg-card border border-border rounded-lg p-5 space-y-4">
                <Label className="font-body text-sm text-muted-foreground block">3. Enter Deposit Details</Label>
                <div>
                  <p className="font-body text-xs text-muted-foreground mb-1.5">Amount You're Sending</p>
                  <div className="flex gap-2">
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
                  <p className="font-body text-xs text-muted-foreground mb-1.5">Transaction Hash <span className="text-muted-foreground/60">(optional — speeds up verification)</span></p>
                  <Input
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="0x... or paste your TX hash"
                    className="bg-input border-border text-foreground font-mono text-sm"
                  />
                </div>
              </div>

              {/* ── Investment Plan Selector ────────────── */}
              {plans.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className="text-primary" />
                      <Label className="font-body text-sm text-muted-foreground">4. Choose an Investment Plan</Label>
                    </div>
                    <button onClick={() => navigate("/plans")} className="font-body text-xs text-primary hover:underline">
                      View details →
                    </button>
                  </div>

                  {/* Dropdown */}
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-input border border-border text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring mb-3"
                  >
                    <option value="">— Select a plan —</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · Min ${p.min_investment.toLocaleString()}{p.min_investment >= ENTERPRISE_THRESHOLD ? "+" : ""} · {p.min_investment >= ENTERPRISE_THRESHOLD ? "Contact Us" : `${p.expected_return_min}–${p.expected_return_max}% return`}
                      </option>
                    ))}
                  </select>

                  {/* Plan preview card */}
                  {(() => {
                    const plan = plans.find((p) => p.id === selectedPlanId);
                    if (!plan) return (
                      <p className="font-body text-xs text-muted-foreground text-center py-2">
                        Select a plan above to see details.
                      </p>
                    );
                    const isEnterprise = plan.min_investment >= ENTERPRISE_THRESHOLD;
                    const colorClass = riskColors[plan.risk_level] || riskColors.moderate;
                    return (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-secondary rounded-lg p-4 border border-border"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Shield size={14} className="text-primary" />
                          <span className="font-heading font-bold text-sm text-foreground">{plan.name}</span>
                          <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-pill capitalize ml-auto ${colorClass}`}>
                            {plan.risk_level}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <p className="font-mono text-sm font-bold text-foreground">
                              ${plan.min_investment.toLocaleString()}{isEnterprise ? "+" : ""}
                            </p>
                            <p className="font-body text-[10px] text-muted-foreground">Min. Invest</p>
                          </div>
                          <div>
                            <p className="font-mono text-sm font-bold text-primary">
                              {isEnterprise ? `${plan.expected_return_min}%+` : `${plan.expected_return_min}–${plan.expected_return_max}%`}
                            </p>
                            <p className="font-body text-[10px] text-muted-foreground">Return</p>
                          </div>
                          <div>
                            <p className="font-mono text-sm font-bold text-foreground">{plan.duration_days}d</p>
                            <p className="font-body text-[10px] text-muted-foreground">Duration</p>
                          </div>
                        </div>
                        {isEnterprise ? (
                          <a
                            href={`mailto:${ENTERPRISE_EMAIL}?subject=Enterprise Investment Enquiry`}
                            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-400/10 border border-amber-400/30 font-body text-xs text-amber-400 hover:bg-amber-400/20 transition-colors"
                          >
                            <Mail size={12} /> Contact us at {ENTERPRISE_EMAIL}
                          </a>
                        ) : (
                          <p className="font-body text-[10px] text-muted-foreground text-center mt-3">
                            Complete your deposit, then go to <button onClick={() => navigate("/plans")} className="text-primary underline">Investment Plans</button> to activate this plan.
                          </p>
                        )}
                      </motion.div>
                    );
                  })()}
                </div>
              )}

              <Button
                variant="hero"
                className="w-full py-6 text-base gap-2"
                onClick={handleContinue}
                disabled={!amount}
              >
                Continue <ArrowRight size={16} />
              </Button>

            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div key="confirm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="font-heading font-bold text-lg text-foreground mb-4">Confirm Deposit</h2>
                <div className="space-y-3">
                  {[
                    { label: "Amount", value: `${Number(amount).toLocaleString()} ${selectedCurrency}` },
                    { label: "Network", value: selectedChain.name },
                    { label: "Sending To", value: `${platformAddress.slice(0, 12)}...${platformAddress.slice(-8)}` },
                    ...(txHash ? [{ label: "TX Hash", value: `${txHash.slice(0, 12)}...${txHash.slice(-6)}` }] : []),
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between py-2 border-b border-border/30 last:border-0">
                      <span className="font-body text-sm text-muted-foreground">{item.label}</span>
                      <span className="font-mono text-sm text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-400/5 border border-amber-400/20 rounded-lg p-3 mt-5 flex gap-2">
                  <AlertCircle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="font-body text-xs text-amber-400">
                    Only confirm after you've already sent the funds on-chain. Our team reviews deposits and credits your balance within 1–24 hours.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 py-6" onClick={() => setStep("configure")}>Back</Button>
                <Button variant="hero" className="flex-1 py-6" onClick={handleSubmitDeposit} disabled={submitting}>
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : "I've Sent the Funds"}
                </Button>
              </div>
            </motion.div>
          )}

          {step === "submitted" && (
            <motion.div key="submitted" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              {/* Header based on receiptUploaded */}
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-accent-dim flex items-center justify-center mx-auto mb-4">
                  {receiptUploaded ? <Check size={28} className="text-primary" /> : <Upload size={28} className="text-primary" />}
                </motion.div>
                <h2 className="font-heading font-bold text-xl text-foreground mb-2">
                  {receiptUploaded ? "Receipt Uploaded!" : "Deposit Submitted!"}
                </h2>
                <p className="font-body text-sm text-muted-foreground mb-6">
                  {receiptUploaded ?
                    `Your receipt for ${Number(amount).toLocaleString()} ${selectedCurrency} has been sent. We'll credit your account within 1–24 hours.` :
                    `Your deposit of ${Number(amount).toLocaleString()} ${selectedCurrency} is under review. Upload a receipt to speed up verification.`
                  }
                </p>
                <div className="flex items-center justify-center gap-2">
                  {["Submitted", "Processing", "Confirmed"].map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold ${(i === 0 || (i === 1 && receiptUploaded) || (i === 2 && receiptUploaded)) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                        }`}>{i + 1}</div>
                      <span className={`font-body text-xs ${(i === 0 || (i === 1 && receiptUploaded) || (i === 2 && receiptUploaded)) ? "text-primary" : "text-muted-foreground"
                        }`}>{s}</span>
                      {i < 2 && <div className="w-8 h-px bg-border" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Receipt Upload — REQUIRED */}
              {!receiptUploaded ? (
                <div className="bg-card border border-amber-400/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Upload size={14} className="text-amber-400" />
                      <h3 className="font-heading font-bold text-base text-foreground">Payment Receipt</h3>
                    </div>
                    <span className="font-mono text-[10px] bg-amber-400/15 text-amber-400 px-2 py-0.5 rounded-pill border border-amber-400/20">REQUIRED</span>
                  </div>
                  <p className="font-body text-xs text-muted-foreground mb-4">
                    Upload a screenshot of your payment. Your deposit <span className="text-amber-400 font-medium">won't be reviewed without this</span>.
                  </p>
                  {receiptPreview ? (
                    <div className="mb-4">
                      <img src={receiptPreview} alt="Receipt preview" className="w-full max-h-56 object-contain rounded-lg border border-border mb-2" />
                      <button onClick={() => { setReceipt(null); setReceiptPreview(null); }} className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">✕ Remove and choose different file</button>
                    </div>
                  ) : (
                    <button onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-amber-400/30 hover:border-amber-400/60 bg-amber-400/5 hover:bg-amber-400/10 rounded-lg p-8 flex flex-col items-center gap-2 transition-all mb-4 group">
                      <ImageIcon size={28} className="text-amber-400/50 group-hover:text-amber-400 transition-colors" />
                      <span className="font-body text-sm font-medium text-foreground">Click to select receipt</span>
                      <span className="font-body text-xs text-muted-foreground">JPG, PNG, PDF · Max 5MB</span>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFileSelect} />
                  <Button variant="hero" className="w-full py-5" onClick={handleReceiptUpload} disabled={!receipt || uploadingReceipt}>
                    {uploadingReceipt
                      ? <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />Uploading...</>
                      : receipt
                        ? <><Upload size={14} className="mr-2" />Submit Receipt & Complete Deposit</>
                        : "Select a Receipt File First"}
                  </Button>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-accent-dim/20 border border-primary/20 rounded-xl p-5 flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-primary flex-shrink-0" />
                  <p className="font-body text-sm text-muted-foreground">Receipt received! Our team will verify and credit your balance within <span className="text-foreground font-medium">1–24 hours</span>.</p>
                </motion.div>
              )}

              {/* Action buttons — only after receipt is uploaded */}
              {receiptUploaded && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 justify-center pt-1">
                  <Button variant="outline" onClick={() => navigate("/transactions")}>View Transactions</Button>
                  <Button variant="hero" onClick={() => {
                    setStep("configure"); setAmount(""); setTxHash("");
                    setReceipt(null); setReceiptPreview(null); setReceiptUploaded(false);
                  }}>New Deposit</Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default Deposit;
