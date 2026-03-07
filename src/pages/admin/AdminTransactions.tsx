import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle, XCircle, Clock, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const statusFilters = ["All", "Pending", "Processing", "Completed", "Failed", "Cancelled"];

const AdminTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; tx: any | null; action: string }>({
    open: false, tx: null, action: "",
  });
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    const [txRes, profilesRes] = await Promise.all([
      supabase.from("transactions").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, display_name, email"),
    ]);
    if (txRes.data) setTransactions(txRes.data);
    if (profilesRes.data) {
      const map: Record<string, any> = {};
      profilesRes.data.forEach((p) => { map[p.user_id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleReview = async () => {
    if (!reviewDialog.tx || !user) return;
    setActionLoading(true);

    const newStatus = reviewDialog.action === "approve" ? "completed" : "failed";

    // We can't update transactions directly (no UPDATE RLS for regular flow), 
    // but admin needs this. Let's use an edge function approach or direct update.
    // For now, we'll create a review record and notify the user.
    const { error: reviewError } = await supabase.from("transaction_reviews").insert({
      transaction_id: reviewDialog.tx.id,
      reviewed_by: user.id,
      status: reviewDialog.action === "approve" ? "approved" : "rejected",
      notes: reviewNotes,
      reviewed_at: new Date().toISOString(),
    });

    // Send notification to user
    await supabase.from("notifications").insert({
      user_id: reviewDialog.tx.user_id,
      title: reviewDialog.action === "approve" ? "Transaction Approved" : "Transaction Rejected",
      message: `Your ${reviewDialog.tx.type} of $${reviewDialog.tx.amount} ${reviewDialog.tx.currency} has been ${reviewDialog.action === "approve" ? "approved" : "rejected"}.${reviewNotes ? ` Note: ${reviewNotes}` : ""}`,
      type: reviewDialog.action === "approve" ? "success" : "error",
      link: "/transactions",
    });

    if (reviewError) {
      toast.error(reviewError.message);
    } else {
      toast.success(`Transaction ${reviewDialog.action === "approve" ? "approved" : "rejected"}`);
    }

    setActionLoading(false);
    setReviewDialog({ open: false, tx: null, action: "" });
    setReviewNotes("");
    fetchData();
  };

  const filtered = transactions.filter((tx) => {
    const matchesFilter = filter === "All" || tx.status === filter.toLowerCase();
    const profile = profiles[tx.user_id];
    const matchesSearch = !search ||
      profile?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      profile?.email?.toLowerCase().includes(search.toLowerCase()) ||
      tx.reference?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalVolume = transactions.reduce((acc, tx) => acc + Number(tx.amount), 0);
  const pendingCount = transactions.filter((tx) => tx.status === "pending").length;

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="font-heading font-bold text-3xl text-foreground mb-1">Transaction Management</h1>
          <p className="font-body text-sm text-muted-foreground">
            {transactions.length} total transactions · ${totalVolume.toLocaleString()} volume · {pendingCount} pending review
          </p>
        </motion.div>

        {/* Stat Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Volume", value: `$${totalVolume.toLocaleString()}`, color: "text-primary" },
            { label: "Pending", value: pendingCount.toString(), color: "text-amber-400" },
            { label: "Completed", value: transactions.filter((t) => t.status === "completed").length.toString(), color: "text-primary" },
            { label: "Failed", value: transactions.filter((t) => t.status === "failed").length.toString(), color: "text-destructive" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-4">
              <p className="font-body text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`font-mono text-xl font-medium ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by user or reference..." className="pl-9 bg-input border-border text-foreground" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {statusFilters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-pill text-xs font-body font-medium transition-all ${
                  filter === f ? "bg-accent-dim text-primary" : "text-muted-foreground hover:text-foreground bg-secondary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-secondary rounded animate-pulse" />)}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-body text-xs text-muted-foreground p-4">Type</th>
                  <th className="text-left font-body text-xs text-muted-foreground p-4 hidden md:table-cell">User</th>
                  <th className="text-right font-body text-xs text-muted-foreground p-4">Amount</th>
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
                    <tr key={tx.id} className="border-b border-border/30 hover:bg-card-hover transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isIncome ? "bg-accent-dim" : "bg-destructive/10"}`}>
                            {isIncome ? <ArrowDownLeft size={14} className="text-primary" /> : <ArrowUpRight size={14} className="text-destructive" />}
                          </div>
                          <span className="font-body text-sm text-foreground capitalize">{tx.type}</span>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <p className="font-body text-sm text-foreground">{profile?.display_name || "Unknown"}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{profile?.email}</p>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-mono text-sm ${isIncome ? "text-primary" : "text-foreground"}`}>
                          {isIncome ? "+" : "-"}${Math.abs(tx.amount).toLocaleString()}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground ml-1">{tx.currency}</span>
                      </td>
                      <td className="p-4 text-right font-mono text-xs text-muted-foreground hidden sm:table-cell">
                        {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-mono text-xs px-2 py-0.5 rounded-pill capitalize ${
                          tx.status === "completed" ? "bg-accent-dim text-primary"
                          : tx.status === "pending" ? "bg-amber-400/10 text-amber-400"
                          : tx.status === "processing" ? "bg-blue-400/10 text-blue-400"
                          : "bg-destructive/10 text-destructive"
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {tx.status === "pending" && (
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => setReviewDialog({ open: true, tx, action: "approve" })}
                              className="p-1.5 rounded-lg bg-accent-dim text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                              title="Approve"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => setReviewDialog({ open: true, tx, action: "reject" })}
                              className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                              title="Reject"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        )}
                        {tx.status !== "pending" && (
                          <span className="font-mono text-[10px] text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center font-body text-sm text-muted-foreground">No transactions found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </motion.div>
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onOpenChange={(o) => { if (!o) setReviewDialog({ open: false, tx: null, action: "" }); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">
              {reviewDialog.action === "approve" ? "Approve" : "Reject"} Transaction
            </DialogTitle>
          </DialogHeader>
          {reviewDialog.tx && (
            <div className="space-y-4">
              <div className="bg-secondary rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-body text-xs text-muted-foreground">Type</span>
                  <span className="font-mono text-sm text-foreground capitalize">{reviewDialog.tx.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-body text-xs text-muted-foreground">Amount</span>
                  <span className="font-mono text-sm text-foreground">${reviewDialog.tx.amount.toLocaleString()} {reviewDialog.tx.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-body text-xs text-muted-foreground">User</span>
                  <span className="font-mono text-xs text-muted-foreground">{profiles[reviewDialog.tx.user_id]?.email || "Unknown"}</span>
                </div>
              </div>
              <div>
                <label className="font-body text-sm text-muted-foreground mb-1.5 block">Review Notes (optional)</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this review..."
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog({ open: false, tx: null, action: "" })}>Cancel</Button>
            <Button
              onClick={handleReview}
              disabled={actionLoading}
              className={reviewDialog.action === "approve" ? "" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"}
            >
              {actionLoading ? "Processing..." : reviewDialog.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminTransactions;
