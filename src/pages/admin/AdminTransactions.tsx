import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search, CheckCircle, XCircle, Clock, ArrowUpRight, ArrowDownLeft,
  ExternalLink, ImageIcon, Copy, Check, User, Wallet, RefreshCw, Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const statusFilters = ["All", "Pending", "Processing", "Completed", "Failed"];
const typeFilters = ["All", "Deposit", "Withdrawal"];

// Blockchain explorer links per network
const explorerLinks: Record<string, { name: string; url: string }> = {
  bitcoin: { name: "Blockstream", url: "https://blockstream.info/tx/" },
  ethereum: { name: "Etherscan", url: "https://etherscan.io/tx/" },
  bsc: { name: "BscScan", url: "https://bscscan.com/tx/" },
  polygon: { name: "Polygonscan", url: "https://polygonscan.com/tx/" },
  solana: { name: "Solscan", url: "https://solscan.io/tx/" },
  tron: { name: "Tronscan", url: "https://tronscan.org/#/transaction/" },
};

const statusColors: Record<string, string> = {
  completed: "bg-accent-dim text-primary",
  pending: "bg-amber-400/10 text-amber-400",
  processing: "bg-blue-400/10 text-blue-400",
  failed: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const sb = supabase as any;
    const [txRes, profilesRes] = await Promise.all([
      supabase.from("transactions").select("*").order("created_at", { ascending: false }),
      sb.from("profiles").select("user_id, display_name, email, balance, avatar_url"),
    ]);
    if (txRes.data) setTransactions(txRes.data);
    if (profilesRes.data) {
      const map: Record<string, any> = {};
      (profilesRes.data as any[]).forEach((p: any) => { map[p.user_id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Real-time subscription for new pending transactions
  useEffect(() => {
    const channel = supabase
      .channel("admin-tx-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const handleAction = async (action: "completed" | "failed" | "processing") => {
    if (!selectedTx) return;
    setActionLoading(true);

    const sb = supabase as any;
    const rpcResult: { data: any; error: any } = await sb.rpc("admin_update_transaction", {
      p_transaction_id: selectedTx.id,
      p_status: action,
      p_notes: reviewNotes || null,
    });
    const { data, error } = rpcResult;

    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Action failed");
    } else {
      const labels: Record<string, string> = {
        completed: "✅ Transaction approved — balance credited",
        failed: "❌ Transaction rejected — user notified",
        processing: "⏳ Marked as processing — user notified",
      };
      toast.success(labels[action]);
      setSelectedTx(null);
      setReviewNotes("");
      fetchData();
    }
    setActionLoading(false);
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const filtered = transactions.filter((tx) => {
    const matchesStatus = statusFilter === "All" || tx.status === statusFilter.toLowerCase();
    const matchesType = typeFilter === "All" || tx.type === typeFilter.toLowerCase();
    const profile = profiles[tx.user_id];
    const matchesSearch = !search ||
      profile?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      profile?.email?.toLowerCase().includes(search.toLowerCase()) ||
      tx.reference?.toLowerCase().includes(search.toLowerCase()) ||
      tx.tx_hash?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const pendingCount = transactions.filter(t => t.status === "pending").length;
  const totalVolume = transactions.filter(t => t.status === "completed" && t.type === "deposit")
    .reduce((s, t) => s + Number(t.amount), 0);

  const selectedProfile = selectedTx ? profiles[selectedTx.user_id] : null;
  const explorerInfo = selectedTx?.network ? explorerLinks[selectedTx.network] : null;

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-bold text-3xl text-foreground mb-1">Transaction Management</h1>
            <p className="font-body text-sm text-muted-foreground">
              {pendingCount > 0 && <span className="text-amber-400 font-medium">{pendingCount} pending review · </span>}
              ${totalVolume.toLocaleString()} confirmed volume
            </p>
          </div>
          <button onClick={fetchData} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw size={16} />
          </button>
        </motion.div>

        {/* Stat Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Pending Review", value: pendingCount, color: "text-amber-400", urgent: pendingCount > 0 },
            { label: "Processing", value: transactions.filter(t => t.status === "processing").length, color: "text-blue-400", urgent: false },
            { label: "Completed", value: transactions.filter(t => t.status === "completed").length, color: "text-primary", urgent: false },
            { label: "Total Volume", value: `$${totalVolume.toLocaleString()}`, color: "text-primary", urgent: false },
          ].map((s) => (
            <div key={s.label} className={`bg-card border rounded-lg p-4 ${s.urgent ? "border-amber-400/30" : "border-border"}`}>
              <p className="font-body text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`font-mono text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search user, email, TX hash..." className="pl-9 bg-input border-border text-foreground" />
          </div>
          <div className="flex gap-1 flex-wrap items-center">
            <Filter size={12} className="text-muted-foreground mr-1" />
            {statusFilters.map((f) => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-pill text-xs font-body font-medium transition-all ${statusFilter === f ? "bg-accent-dim text-primary" : "text-muted-foreground hover:text-foreground bg-secondary"}`}>
                {f}{f === "Pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
              </button>
            ))}
            <div className="w-px h-4 bg-border mx-1" />
            {typeFilters.map((f) => (
              <button key={f} onClick={() => setTypeFilter(f)}
                className={`px-3 py-1.5 rounded-pill text-xs font-body font-medium transition-all ${typeFilter === f ? "bg-accent-dim text-primary" : "text-muted-foreground hover:text-foreground bg-secondary"}`}>
                {f}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded animate-pulse" />)}</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-body text-xs text-muted-foreground p-4">Type</th>
                  <th className="text-left font-body text-xs text-muted-foreground p-4 hidden md:table-cell">User</th>
                  <th className="text-right font-body text-xs text-muted-foreground p-4">Amount</th>
                  <th className="text-center font-body text-xs text-muted-foreground p-4 hidden lg:table-cell">Receipt</th>
                  <th className="text-right font-body text-xs text-muted-foreground p-4 hidden sm:table-cell">Date</th>
                  <th className="text-right font-body text-xs text-muted-foreground p-4">Status</th>
                  <th className="text-right font-body text-xs text-muted-foreground p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => {
                  const isIncome = tx.type === "deposit" || tx.type === "return";
                  const profile = profiles[tx.user_id];
                  return (
                    <tr key={tx.id} className="border-b border-border/30 hover:bg-card-hover transition-colors cursor-pointer" onClick={() => { setSelectedTx(tx); setReviewNotes(""); }}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isIncome ? "bg-accent-dim" : "bg-destructive/10"}`}>
                            {isIncome ? <ArrowDownLeft size={14} className="text-primary" /> : <ArrowUpRight size={14} className="text-destructive" />}
                          </div>
                          <div>
                            <span className="font-body text-sm text-foreground capitalize">{tx.type}</span>
                            {tx.network && <p className="font-mono text-[10px] text-muted-foreground capitalize">{tx.network}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <p className="font-body text-sm text-foreground">{profile?.display_name || "Unknown"}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{profile?.email}</p>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-mono text-sm font-medium ${isIncome ? "text-primary" : "text-foreground"}`}>
                          {isIncome ? "+" : "-"}${Math.abs(Number(tx.amount)).toLocaleString()}
                        </span>
                        <p className="font-mono text-xs text-muted-foreground">{tx.currency}</p>
                      </td>
                      <td className="p-4 text-center hidden lg:table-cell">
                        {tx.receipt_url ? (
                          <span className="inline-flex items-center gap-1 font-body text-xs text-primary bg-accent-dim px-2 py-0.5 rounded-pill">
                            <ImageIcon size={10} /> Receipt
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4 text-right font-mono text-xs text-muted-foreground hidden sm:table-cell">
                        {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        <p>{new Date(tx.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-mono text-xs px-2 py-0.5 rounded-pill capitalize ${statusColors[tx.status] || statusColors.pending}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {tx.status === "pending" && (
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => { setSelectedTx(tx); setReviewNotes(""); }}
                              className="p-1.5 rounded-lg bg-accent-dim text-primary hover:bg-primary hover:text-primary-foreground transition-colors" title="Review">
                              <CheckCircle size={14} />
                            </button>
                            <button onClick={() => { setSelectedTx(tx); setReviewNotes(""); }}
                              className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors" title="Reject">
                              <XCircle size={14} />
                            </button>
                          </div>
                        )}
                        {tx.status !== "pending" && <span className="font-mono text-[10px] text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-12 text-center font-body text-sm text-muted-foreground">No transactions found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </motion.div>
      </div>

      {/* Transaction Detail & Review Dialog */}
      <Dialog open={!!selectedTx} onOpenChange={(o) => { if (!o) setSelectedTx(null); }}>
        <DialogContent className="bg-card border-border max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground flex items-center gap-2">
              Review Transaction
              {selectedTx?.status && (
                <span className={`font-mono text-xs px-2 py-0.5 rounded-pill capitalize ${statusColors[selectedTx.status] || statusColors.pending}`}>
                  {selectedTx.status}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedTx && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Transaction Details, User Info, Review Notes */}
              <div className="space-y-4">
                {/* Transaction Details */}
                <div className="bg-secondary rounded-lg p-4 space-y-3">
                  <h4 className="font-body text-xs text-muted-foreground uppercase tracking-wide mb-2">Transaction Details</h4>
                  {[
                    { label: "Type", value: selectedTx.type, mono: false, capitalize: true },
                    { label: "Amount", value: `$${Number(selectedTx.amount).toLocaleString()} ${selectedTx.currency}`, mono: true },
                    { label: "Network", value: selectedTx.network || "—", mono: true, capitalize: true },
                    { label: "Date", value: new Date(selectedTx.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }), mono: true },
                    { label: "Reference", value: selectedTx.reference || "—", mono: true },
                  ].map(({ label, value, mono, capitalize }) => (
                    <div key={label} className="flex justify-between items-start gap-4">
                      <span className="font-body text-xs text-muted-foreground flex-shrink-0">{label}</span>
                      <span className={`text-right ${mono ? "font-mono text-xs" : "font-body text-sm"} text-foreground ${capitalize ? "capitalize" : ""} break-all`}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* User Info */}
                {selectedProfile && (
                  <div className="bg-secondary rounded-lg p-4">
                    <h4 className="font-body text-xs text-muted-foreground uppercase tracking-wide mb-2">User</h4>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        {selectedProfile.avatar_url
                          ? <img src={selectedProfile.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                          : <User size={14} className="text-primary" />}
                      </div>
                      <div>
                        <p className="font-body text-sm text-foreground">{selectedProfile.display_name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{selectedProfile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Wallet size={11} className="text-muted-foreground" />
                      <span className="font-body text-xs text-muted-foreground">Current Balance:</span>
                      <span className="font-mono text-xs text-primary">${Number(selectedProfile.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}

                {/* Review Notes */}
                {selectedTx.status === "pending" || selectedTx.status === "processing" ? (
                  <div>
                    <label className="font-body text-sm text-muted-foreground mb-1.5 block">Admin Notes (shown to user)</label>
                    <Textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Optional: reason for rejection, request more info, etc."
                      className="bg-input border-border text-foreground"
                      rows={3}
                    />
                  </div>
                ) : null}
              </div>

              {/* Right Column: TX Hash + Explorer, Receipt Image */}
              <div className="space-y-4">
                {/* TX Hash + Explorer */}
                {selectedTx.tx_hash && (
                  <div className="bg-secondary rounded-lg p-4">
                    <h4 className="font-body text-xs text-muted-foreground uppercase tracking-wide mb-2">Transaction Hash</h4>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 font-mono text-xs text-foreground bg-input rounded-md px-2 py-1.5 break-all">{selectedTx.tx_hash}</code>
                      <button onClick={() => copyHash(selectedTx.tx_hash)} className="p-1.5 rounded-md bg-input hover:bg-secondary transition-colors flex-shrink-0">
                        {copiedHash ? <Check size={12} className="text-primary" /> : <Copy size={12} className="text-muted-foreground" />}
                      </button>
                    </div>
                    {explorerInfo && (
                      <a href={`${explorerInfo.url}${selectedTx.tx_hash}`} target="_blank" rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-1 font-body text-xs text-primary hover:underline">
                        <ExternalLink size={11} /> Verify on {explorerInfo.name}
                      </a>
                    )}
                  </div>
                )}

                {/* Receipt Image */}
                {selectedTx.receipt_url && (
                  <div className="bg-secondary rounded-lg p-4">
                    <h4 className="font-body text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                      <ImageIcon size={11} /> Payment Receipt
                    </h4>
                    <a href={selectedTx.receipt_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={selectedTx.receipt_url}
                        alt="Payment receipt"
                        className="w-full rounded-lg object-contain max-h-64 border border-border hover:opacity-90 transition-opacity cursor-pointer"
                      />
                      <p className="font-body text-xs text-primary mt-1.5 flex items-center gap-1">
                        <ExternalLink size={10} /> Open full size
                      </p>
                    </a>
                  </div>
                )}

                {/* No receipt notice */}
                {!selectedTx.receipt_url && selectedTx.type === "deposit" && (
                  <div className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
                    <ImageIcon size={13} className="text-amber-400 flex-shrink-0" />
                    <p className="font-body text-xs text-amber-400">No receipt uploaded by user yet. Verify via TX hash if available.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setSelectedTx(null)} className="sm:mr-auto">Close</Button>
            {selectedTx?.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  className="border-blue-400/30 text-blue-400 hover:bg-blue-400/10"
                  onClick={() => handleAction("processing")}
                  disabled={actionLoading}
                >
                  <Clock size={13} className="mr-1" />
                  {actionLoading ? "..." : "Mark Processing"}
                </Button>
                <Button
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  onClick={() => handleAction("failed")}
                  disabled={actionLoading}
                >
                  <XCircle size={13} className="mr-1" />
                  {actionLoading ? "..." : "Reject"}
                </Button>
                <Button variant="hero" onClick={() => handleAction("completed")} disabled={actionLoading}>
                  <CheckCircle size={13} className="mr-1" />
                  {actionLoading ? "Processing..." : "Approve & Credit"}
                </Button>
              </>
            )}
            {selectedTx?.status === "processing" && (
              <>
                <Button
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  onClick={() => handleAction("failed")}
                  disabled={actionLoading}
                >
                  <XCircle size={13} className="mr-1" />
                  {actionLoading ? "..." : "Reject"}
                </Button>
                <Button variant="hero" onClick={() => handleAction("completed")} disabled={actionLoading}>
                  <CheckCircle size={13} className="mr-1" />
                  {actionLoading ? "Processing..." : "Approve & Credit"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminTransactions;
