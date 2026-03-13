import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Gift, CheckCircle, Clock, RefreshCw, Users, DollarSign, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const statusColors: Record<string, string> = {
    pending: "bg-amber-400/10 text-amber-400",
    completed: "bg-accent-dim text-primary",
    rejected: "bg-destructive/10 text-destructive",
};

const AdminReferrals = () => {
    const [referrals, setReferrals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selected, setSelected] = useState<any | null>(null);
    const [rewardReferrer, setRewardReferrer] = useState("50");
    const [rewardReferred, setRewardReferred] = useState("25");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        // Query referrals and join profiles manually since view may not exist yet
        const { data } = await (supabase as any)
            .from("referrals")
            .select("*, referrer:profiles!referrals_referrer_id_fkey(display_name, email, user_id), referred:profiles!referrals_referred_id_fkey(display_name, email, user_id, created_at)")
            .order("created_at", { ascending: false });

        if (data) setReferrals(data);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleComplete = async () => {
        if (!selected) return;
        setActionLoading(true);

        const sb = supabase as any;
        const result: { data: any; error: any } = await sb.rpc("admin_complete_referral", {
            p_referral_id: selected.id,
            p_reward_referrer: Number(rewardReferrer),
            p_reward_referred: Number(rewardReferred),
        });

        const { data, error } = result;
        if (error || data?.error) {
            toast.error(data?.error || error?.message || "Failed");
        } else {
            toast.success(`✅ Referral completed — $${rewardReferrer} to referrer, $${rewardReferred} to new user`);
            setSelected(null);
            fetchData();
        }
        setActionLoading(false);
    };

    const handleReject = async () => {
        if (!selected) return;
        setActionLoading(true);
        const { error } = await supabase.from("referrals").update({ status: "rejected" }).eq("id", selected.id);
        if (error) toast.error(error.message);
        else { toast.success("Referral rejected"); setSelected(null); fetchData(); }
        setActionLoading(false);
    };

    const filtered = referrals.filter((r) => {
        const matchesStatus = statusFilter === "All" || r.status === statusFilter.toLowerCase();
        const matchesSearch = !search ||
            r.referrer?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
            r.referrer?.email?.toLowerCase().includes(search.toLowerCase()) ||
            r.referred?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
            r.referred?.email?.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const totalPending = referrals.filter(r => r.status === "pending").length;
    const totalCompleted = referrals.filter(r => r.status === "completed").length;
    const totalRewarded = referrals.filter(r => r.status === "completed").reduce((s, r) => s + Number(r.reward_amount || 0), 0);
    const uniqueReferrers = new Set(referrals.map(r => r.referrer_id)).size;

    return (
        <AdminLayout>
            <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="font-heading font-bold text-3xl text-foreground mb-1">Referral Management</h1>
                        <p className="font-body text-sm text-muted-foreground">Track who referred who and reward successful conversions</p>
                    </div>
                    <button onClick={fetchData} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground transition-colors">
                        <RefreshCw size={16} />
                    </button>
                </motion.div>

                {/* Stats */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: "Total Referrals", value: referrals.length, icon: Users, color: "text-foreground" },
                        { label: "Pending Review", value: totalPending, icon: Clock, color: totalPending > 0 ? "text-amber-400" : "text-muted-foreground" },
                        { label: "Completed", value: totalCompleted, icon: CheckCircle, color: "text-primary" },
                        { label: "Total Rewards Paid", value: `$${totalRewarded}`, icon: DollarSign, color: "text-primary" },
                    ].map((s) => (
                        <div key={s.label} className={`bg-card border rounded-lg p-4 ${s.label === "Pending Review" && totalPending > 0 ? "border-amber-400/30" : "border-border"}`}>
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-body text-xs text-muted-foreground">{s.label}</p>
                                <s.icon size={13} className={s.color} />
                            </div>
                            <p className={`font-mono text-xl font-bold ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Filters */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="pl-9 bg-input border-border text-foreground" />
                    </div>
                    <div className="flex gap-1">
                        {["All", "Pending", "Completed", "Rejected"].map((f) => (
                            <button key={f} onClick={() => setStatusFilter(f)}
                                className={`px-3 py-1.5 rounded-pill text-xs font-body font-medium transition-all ${statusFilter === f ? "bg-accent-dim text-primary" : "text-muted-foreground hover:text-foreground bg-secondary"}`}>
                                {f}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Table */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="p-8 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded animate-pulse" />)}</div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left font-body text-xs text-muted-foreground p-4">Referrer</th>
                                    <th className="text-left font-body text-xs text-muted-foreground p-4 hidden md:table-cell">Referred User</th>
                                    <th className="text-left font-body text-xs text-muted-foreground p-4 hidden lg:table-cell">Ref Code</th>
                                    <th className="text-right font-body text-xs text-muted-foreground p-4 hidden sm:table-cell">Date</th>
                                    <th className="text-right font-body text-xs text-muted-foreground p-4">Status</th>
                                    <th className="text-right font-body text-xs text-muted-foreground p-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r) => (
                                    <tr key={r.id} className="border-b border-border/30 hover:bg-card-hover transition-colors cursor-pointer"
                                        onClick={() => { setSelected(r); setRewardReferrer("50"); setRewardReferred("25"); }}>
                                        <td className="p-4">
                                            <p className="font-body text-sm text-foreground font-medium">{r.referrer?.display_name || "Unknown"}</p>
                                            <p className="font-mono text-[10px] text-muted-foreground">{r.referrer?.email}</p>
                                        </td>
                                        <td className="p-4 hidden md:table-cell">
                                            {r.referred ? (
                                                <>
                                                    <p className="font-body text-sm text-foreground">{r.referred.display_name || "Unknown"}</p>
                                                    <p className="font-mono text-[10px] text-muted-foreground">{r.referred.email}</p>
                                                </>
                                            ) : (
                                                <span className="font-mono text-xs text-muted-foreground">Pending signup</span>
                                            )}
                                        </td>
                                        <td className="p-4 hidden lg:table-cell">
                                            <span className="font-mono text-xs text-primary bg-accent-dim px-2 py-0.5 rounded-pill">{r.referral_code || "—"}</span>
                                        </td>
                                        <td className="p-4 text-right hidden sm:table-cell">
                                            <span className="font-mono text-xs text-muted-foreground">
                                                {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className={`font-mono text-[10px] px-2 py-0.5 rounded-pill capitalize ${statusColors[r.status] || statusColors.pending}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            {r.status === "pending" && (
                                                <button onClick={() => { setSelected(r); }}
                                                    className="p-1.5 rounded-lg bg-accent-dim text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                                                    <ChevronRight size={13} />
                                                </button>
                                            )}
                                            {r.status === "completed" && (
                                                <span className="font-mono text-xs text-primary">+${r.reward_amount}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={6} className="p-12 text-center font-body text-sm text-muted-foreground">No referrals found</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </motion.div>
            </div>

            {/* Review Dialog */}
            <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
                <DialogContent className="bg-card border-border max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-foreground flex items-center gap-2">
                            <Gift size={16} className="text-primary" /> Review Referral
                        </DialogTitle>
                    </DialogHeader>

                    {selected && (
                        <div className="space-y-4">
                            {/* Referral chain */}
                            <div className="bg-secondary rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="text-center flex-1">
                                        <p className="font-body text-xs text-muted-foreground mb-1">Referrer</p>
                                        <p className="font-body text-sm font-bold text-foreground">{selected.referrer?.display_name}</p>
                                        <p className="font-mono text-[10px] text-muted-foreground">{selected.referrer?.email}</p>
                                    </div>
                                    <div className="flex-shrink-0 text-center">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                                            <Gift size={14} className="text-primary" />
                                        </div>
                                        <p className="font-mono text-[9px] text-muted-foreground mt-1">{selected.referral_code}</p>
                                    </div>
                                    <div className="text-center flex-1">
                                        <p className="font-body text-xs text-muted-foreground mb-1">Referred User</p>
                                        <p className="font-body text-sm font-bold text-foreground">{selected.referred?.display_name || "—"}</p>
                                        <p className="font-mono text-[10px] text-muted-foreground">{selected.referred?.email || "Pending"}</p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-border/30 flex justify-between text-xs">
                                    <span className="font-body text-muted-foreground">Referred on</span>
                                    <span className="font-mono text-foreground">{new Date(selected.created_at).toLocaleDateString("en-US", { dateStyle: "long" })}</span>
                                </div>
                            </div>

                            {/* Reward config */}
                            {selected.status === "pending" && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="font-body text-xs text-muted-foreground mb-1.5 block">Reward for Referrer ($)</Label>
                                        <Input type="number" value={rewardReferrer} onChange={(e) => setRewardReferrer(e.target.value)} className="bg-input border-border text-foreground font-mono" />
                                    </div>
                                    <div>
                                        <Label className="font-body text-xs text-muted-foreground mb-1.5 block">Reward for New User ($)</Label>
                                        <Input type="number" value={rewardReferred} onChange={(e) => setRewardReferred(e.target.value)} className="bg-input border-border text-foreground font-mono" />
                                    </div>
                                </div>
                            )}

                            {selected.status === "completed" && (
                                <div className="bg-accent-dim/30 border border-primary/20 rounded-lg p-4 text-center">
                                    <CheckCircle size={20} className="text-primary mx-auto mb-2" />
                                    <p className="font-body text-sm text-foreground">Reward of <span className="text-primary font-mono font-bold">${selected.reward_amount}</span> has been paid</p>
                                </div>
                            )}
                        </div>
                    )}

                    {selected?.status === "pending" && (
                        <DialogFooter className="gap-2 pt-2">
                            <Button variant="outline" onClick={handleReject} disabled={actionLoading} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                                Reject
                            </Button>
                            <Button variant="hero" onClick={handleComplete} disabled={actionLoading}>
                                {actionLoading ? "Processing..." : `Complete & Pay $${Number(rewardReferrer) + Number(rewardReferred)}`}
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
};

export default AdminReferrals;
