import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Wallet as WalletIcon, Copy, Trash2, Check, Plug } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import { z } from "zod";
import type { Wallet } from "@/types";
import { WALLET_CHAINS } from "@/lib/constants";
import WalletConnect from "@/components/wallet/WalletConnect";

const walletSchema = z.object({
  address: z.string().trim().min(10, "Invalid wallet address").max(100),
  label: z.string().trim().max(50).optional(),
  chain: z.string().trim().min(1),
});

const Wallets = () => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<"connect" | "manual">("connect");
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [chain, setChain] = useState("ethereum");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchWallets = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("wallets").select("*").eq("user_id", user.id).order("created_at");
    if (error) toast.error("Failed to load wallets");
    else if (data) setWallets(data);
    setLoading(false);
  };

  useEffect(() => { fetchWallets(); }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = walletSchema.safeParse({ address, label, chain });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("wallets").insert({
      user_id: user.id,
      address,
      label: label || null,
      chain,
      is_primary: wallets.length === 0,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Wallet added!");
      setAddress("");
      setLabel("");
      setShowAdd(false);
      fetchWallets();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("wallets").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Wallet removed");
      fetchWallets();
    }
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-bold text-3xl text-foreground mb-1">Wallets</h1>
            <p className="font-body text-sm text-muted-foreground">Manage your connected crypto wallets</p>
          </div>
          <Button variant="hero" onClick={() => setShowAdd(!showAdd)} className="gap-2">
            <Plus size={16} /> Add Wallet
          </Button>
        </motion.div>

        {/* Add Wallet Panel */}
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-card border border-border rounded-xl mb-6 overflow-hidden"
          >
            {/* Mode tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setAddMode("connect")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-body font-medium transition-all ${addMode === "connect" ? "text-primary border-b-2 border-primary bg-accent-dim/30" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Plug size={14} />
                Connect Wallet
                <span className="font-mono text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded">+$25 bonus</span>
              </button>
              <button
                onClick={() => setAddMode("manual")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-body font-medium transition-all ${addMode === "manual" ? "text-primary border-b-2 border-primary bg-accent-dim/30" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Plus size={14} />
                Manual Entry
              </button>
            </div>

            <div className="p-5">
              {addMode === "connect" ? (
                <WalletConnect onConnected={() => { fetchWallets(); setShowAdd(false); }} />
              ) : (
                <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                    <Label className="font-body text-sm text-muted-foreground">Wallet Address</Label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x..." className="mt-1.5 bg-input border-border text-foreground" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-body text-sm text-muted-foreground">Label (optional)</Label>
                      <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="My Wallet" className="mt-1.5 bg-input border-border text-foreground" />
                    </div>
                    <div>
                      <Label className="font-body text-sm text-muted-foreground">Chain</Label>
                      <select value={chain} onChange={(e) => setChain(e.target.value)} className="mt-1.5 w-full h-10 px-3 rounded-md bg-input border border-border text-foreground text-sm font-body">
                        {WALLET_CHAINS.map((c) => (
                          <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" variant="hero" disabled={saving}>{saving ? "Saving..." : "Add Wallet"}</Button>
                    <Button type="button" variant="hero-ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}

        {/* Wallet List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg h-20 animate-pulse" />
            ))}
          </div>
        ) : wallets.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <WalletIcon size={40} className="text-muted-foreground mx-auto mb-4" />
            <p className="font-heading font-bold text-lg text-foreground mb-1">No wallets connected</p>
            <p className="font-body text-sm text-muted-foreground">Add a wallet to start depositing and investing</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wallets.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 hover:border-border-light transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center">
                  <WalletIcon size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-body text-sm font-medium text-foreground">{w.label || "Unnamed"}</p>
                    {w.is_primary && <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-pill bg-accent-dim text-primary">Primary</span>}
                  </div>
                  <p className="font-mono text-xs text-muted-foreground truncate">{w.address}</p>
                  <p className="font-mono text-xs text-muted-foreground capitalize">{w.chain}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => copyAddress(w.address)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                    {copied === w.address ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                  </button>
                  <button onClick={() => handleDelete(w.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Wallets;
