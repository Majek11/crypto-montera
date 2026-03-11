import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownLeft, Copy, Check, AlertCircle, Info, ArrowRight, Upload, ImageIcon, CheckCircle2 } from "lucide-react";
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
import { CHAINS, CURRENCIES, PLATFORM_DEPOSIT_ADDRESSES } from "@/lib/constants";
import SEO from "@/components/SEO";

const depositSchema = z.object({
  amount: z.number().min(10, "Minimum deposit is $10").max(1000000, "Maximum deposit is $1,000,000"),
});

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

  const platformAddress = PLATFORM_DEPOSIT_ADDRESSES[selectedChain.id] || "Address not configured";

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

    await supabase.from("transactions")
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
                  <div className="w-full bg-accent-dim/30 border border-primary/15 rounded-lg px-4 py-3 flex gap-2">
                    <Info size={14} className="text-primary flex-shrink-0 mt-0.5" />
                    <p className="font-body text-xs text-muted-foreground">
                      Only send <span className="text-primary font-medium">{selectedCurrency}</span> on the <span className="text-primary font-medium">{selectedChain.name}</span> network to this address. Sending other assets may result in permanent loss.
                    </p>
                  </div>
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
              {/* Success header */}
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-accent-dim flex items-center justify-center mx-auto mb-4">
                  <Check size={28} className="text-primary" />
                </motion.div>
                <h2 className="font-heading font-bold text-xl text-foreground mb-2">Deposit Submitted!</h2>
                <p className="font-body text-sm text-muted-foreground mb-6">
                  Your deposit of <span className="text-primary font-medium">{Number(amount).toLocaleString()} {selectedCurrency}</span> is under review. We'll credit your account within <span className="text-foreground font-medium">1–24 hours</span>.
                </p>
                <div className="flex items-center justify-center gap-2">
                  {["Submitted", "Processing", "Confirmed"].map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold ${i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{i + 1}</div>
                      <span className={`font-body text-xs ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>{s}</span>
                      {i < 2 && <div className="w-8 h-px bg-border" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Receipt Upload */}
              <div className={`bg-card border rounded-lg p-6 ${receiptUploaded ? "border-primary/30" : "border-amber-400/30"}`}>
                <div className="flex items-center gap-2 mb-3">
                  {receiptUploaded ? <CheckCircle2 size={16} className="text-primary" /> : <Upload size={16} className="text-amber-400" />}
                  <h3 className="font-heading font-bold text-base text-foreground">
                    {receiptUploaded ? "Receipt Uploaded ✅" : "Upload Payment Receipt (Recommended)"}
                  </h3>
                </div>
                {receiptUploaded ? (
                  <p className="font-body text-sm text-muted-foreground">Your receipt has been sent to our team. This will speed up your deposit confirmation significantly.</p>
                ) : (
                  <>
                    <p className="font-body text-sm text-muted-foreground mb-4">
                      Upload a screenshot of your payment. This helps our team verify your deposit <span className="text-foreground font-medium">up to 10x faster</span>.
                    </p>
                    {receiptPreview ? (
                      <div className="mb-4">
                        <img src={receiptPreview} alt="Receipt preview" className="w-full max-h-48 object-contain rounded-lg border border-border mb-2" />
                        <button onClick={() => { setReceipt(null); setReceiptPreview(null); }} className="font-body text-xs text-muted-foreground hover:text-foreground">Remove &amp; choose different file</button>
                      </div>
                    ) : (
                      <button onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-lg p-6 flex flex-col items-center gap-2 transition-colors mb-4 group">
                        <ImageIcon size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="font-body text-sm text-muted-foreground">Click to upload receipt</span>
                        <span className="font-body text-xs text-muted-foreground">JPG, PNG, PDF — Max 5MB</span>
                      </button>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFileSelect} />
                    {receipt && (
                      <Button variant="hero" className="w-full" onClick={handleReceiptUpload} disabled={uploadingReceipt}>
                        {uploadingReceipt ? <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />Uploading...</> : <><Upload size={14} className="mr-2" />Upload Receipt</>}
                      </Button>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate("/transactions")}>View Transactions</Button>
                <Button variant="hero" onClick={() => { setStep("configure"); setAmount(""); setTxHash(""); setReceipt(null); setReceiptPreview(null); setReceiptUploaded(false); }}>New Deposit</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default Deposit;
