import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Search, TrendingUp, CheckCircle, XCircle, Clock, RefreshCw,
    DollarSign, CalendarClock, Users, Filter, ChevronRight, AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const statusFilters = ["Active", "All", "Completed", "Cancelled"];

const statusColors: Record<string, string> = {
    active: "bg-accent-dim text-primary",
    completed: "bg-blue-400/10 text-blue-400",
    cancelled: "bg-destructive/10 text-destructive",
    paused: "bg-amber-400/10 text-amber-400",
};

const getDaysLeft = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
};

const AdminInvestments = () => {
    const [investments, setInvestments] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<Record<string, any>>({});
    const [statusFilter, setStatusFilter] = useState("Active");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<any | null>(null);
    const [newValue, setNewValue] = useState("");
    const [notes, setNotes] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const sb = supabase as any;
        const [invRes, profilesRes] = await Promise.all([
            supabase.from("investments")
                .select("*, investment_plans(name, expected_return_min, expected_return_max, risk_level)")
                .order("created_at", { ascending: false }),
            sb.from("profiles").select("user_id, display_name, email, balance"),
        ]);

        if (invRes.data) setInvestments(invRes.data);
        if (profilesRes.data) {
            const map: Record<string, any> = {};
            (profilesRes.data as any[]).forEach((p: any) => { map[p.user_id] = p; });
            setProfiles(map);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAction = async (action: "completed" | "cancelled") => {
        if (!selected) return;
        setActionLoading(true);

        const finalValue = Number(newValue) || selected.current_value || selected.amount;

        // Update investment: set current_value (returns) + status
        // This fires the balance trigger to credit the user
        const { error } = await supabase.from("investments").update({
            status: action,
            current_value: action === "completed" ? finalValue : selected.amount,
            total_return: action === "completed" ? finalValue - selected.amount : 0,
        }).eq("id", selected.id);

        if (error) {
            toast.error(error.message);
            setActionLoading(false);
            return;
        }

        // Notify the user
        const profile = profiles[selected.user_id];
        const planName = selected.investment_plans?.name || "Investment";
        await supabase.from("notifications").insert({
            user_id: selected.user_id,
            title: action === "completed" ? "🎉 Investment Matured!" : "Investment Cancelled",
            message: action === "completed"
                ? `Your investment in ${planName} has matured. $${finalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })} has been credited to your balance.${notes ? ` Note: ${notes}` : ""}`
                : `Your investment in ${planName} has been cancelled. $${selected.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} has been refunded to your balance.${notes ? ` Note: ${notes}` : ""}`,
            type: action === "completed" ? "success" : "error",
            link: "/transactions",
        });

        toast.success(action === "completed"
            ? `✅ Investment completed — $${finalValue.toLocaleString()} credited to ${profile?.display_name || "user"}`
            : `❌ Investment cancelled — $${selected.amount.toLocaleString()} refunded`);

        setSelected(null);
        setNewValue("");
        setNotes("");
        fetchData();
        setActionLoading(false);
    };

    const handleUpdateValue = async () => {
        if (!selected || !newValue) return;
        setActionLoading(true);

        const val = Number(newValue);
        const { error } = await supabase.from("investments").update({
            current_value: val,
            total_return: val - selected.amount,
        }).eq("id", selected.id);

        if (error) toast.error(error.message);
        else {
            toast.success(`Current value updated to $${val.toLocaleString()}`);
            fetchData();
            setSelected(null);
            setNewValue("");
        }
        setActionLoading(false);
    };

    const filtered = investments.filter((inv) => {
        const matchesStatus = statusFilter === "All" || inv.status === statusFilter.toLowerCase();
        const profile = profiles[inv.user_id];
        const matchesSearch = !search ||
            profile?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
            profile?.email?.toLowerCase().includes(search.toLowerCase()) ||
            inv.investment_plans?.name?.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Investments maturing within 3 days
    const maturingSoon = investments.filter(
        (inv) => inv.status === "active" && inv.ends_at && getDaysLeft(inv.ends_at) <= 3 && getDaysLeft(inv.ends_at) >= 0
    );

    const totalActiveValue = investments
        .filter((i) => i.status === "active")
        .reduce((s, i) => s + Number(i.current_value || i.amount), 0);

    const selectedProfile = selected ? profiles[selected.user_id] : null;
    const currentReturn = selected
        ? (Number(newValue) || selected.current_value || selected.amount) - selected.amount
        : 0;

    return (
        <AdminLayout>
            <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="font-heading font-bold text-3xl text-foreground mb-1">Investment Management</h1>
                        <p className="font-body text-sm text-muted-foreground">
                            Update returns, mature investments, and credit user balances
                        </p>
                    </div>
                    <button onClick={fetchData} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground transition-colors">
                        <RefreshCw size={16} />
                    </button>
                </motion.div>

                {/* Maturing Soon Alert */}
                {maturingSoon.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-amber-400/10 border border-amber-400/30 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-body text-sm font-medium text-amber-400 mb-1">
                                {maturingSoon.length} investment{maturingSoon.length > 1 ? "s" : ""} maturing within 3 days
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {maturingSoon.map((inv) => {
                                    const p = profiles[inv.user_id];
                                    const d = getDaysLeft(inv.ends_at);
                                    return (
                                        <button key={inv.id} onClick={() => { setSelected(inv); setNewValue(String(inv.current_value || inv.amount)); }}
                                            className="flex items-center gap-1.5 font-body text-xs text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 px-2 py-1 rounded-pill transition-colors">
                                            <span>{p?.display_name || p?.email || "User"}</span>
                                            <span className="opacity-60">·</span>
                                            <span>${Number(inv.amount).toLocaleString()}</span>
                                            <span className="opacity-60">·</span>
                                            <span>{d === 0 ? "Today" : `${d}d`}</span>
                                            <ChevronRight size={10} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Stats */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: "Active Investments", value: investments.filter(i => i.status === "active").length, icon: TrendingUp, color: "text-primary" },
                        { label: "Total AUM (Active)", value: `$${totalActiveValue.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
                        { label: "Maturing ≤3 Days", value: maturingSoon.length, icon: CalendarClock, color: maturingSoon.length > 0 ? "text-amber-400" : "text-muted-foreground" },
                        { label: "Total Investors", value: new Set(investments.map(i => i.user_id)).size, icon: Users, color: "text-foreground" },
                    ].map((s) => (
                        <div key={s.label} className={`bg-card border rounded-lg p-4 ${s.label === "Maturing ≤3 Days" && maturingSoon.length > 0 ? "border-amber-400/30" : "border-border"}`}>
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
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by user or plan name..." className="pl-9 bg-input border-border text-foreground" />
                    </div>
                    <div className="flex gap-1 items-center flex-wrap">
                        <Filter size={12} className="text-muted-foreground mr-1" />
                        {statusFilters.map((f) => (
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
                                    <th className="text-left font-body text-xs text-muted-foreground p-4">User</th>
                                    <th className="text-left font-body text-xs text-muted-foreground p-4 hidden md:table-cell">Plan</th>
                                    <th className="text-right font-body text-xs text-muted-foreground p-4">Invested</th>
                                    <th className="text-right font-body text-xs text-muted-foreground p-4 hidden sm:table-cell">Current Value</th>
                                    <th className="text-right font-body text-xs text-muted-foreground p-4 hidden lg:table-cell">Return</th>
                                    <th className="text-right font-body text-xs text-muted-foreground p-4 hidden md:table-cell">Matures</th>
                                    <th className="text-right font-body text-xs text-muted-foreground p-4">Status</th>
                                    <th className="text-right font-body text-xs text-muted-foreground p-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((inv) => {
                                    const profile = profiles[inv.user_id];
                                    const daysLeft = inv.ends_at ? getDaysLeft(inv.ends_at) : null;
                                    const currentVal = Number(inv.current_value || inv.amount);
                                    const returnAmt = currentVal - Number(inv.amount);
                                    const returnPct = Number(inv.amount) > 0 ? ((returnAmt / Number(inv.amount)) * 100).toFixed(1) : "0.0";
                                    const isUrgent = daysLeft !== null && daysLeft <= 3 && inv.status === "active";

                                    return (
                                        <tr key={inv.id} className={`border-b border-border/30 hover:bg-card-hover transition-colors cursor-pointer ${isUrgent ? "bg-amber-400/3" : ""}`}
                                            onClick={() => { setSelected(inv); setNewValue(String(inv.current_value || inv.amount)); setNotes(""); }}>
                                            <td className="p-4">
                                                <p className="font-body text-sm text-foreground">{profile?.display_name || "Unknown"}</p>
                                                <p className="font-mono text-[10px] text-muted-foreground">{profile?.email}</p>
                                            </td>
                                            <td className="p-4 hidden md:table-cell">
                                                <p className="font-body text-sm text-foreground">{inv.investment_plans?.name || "—"}</p>
                                                <p className="font-mono text-[10px] text-muted-foreground capitalize">{inv.investment_plans?.risk_level}</p>
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className="font-mono text-sm text-foreground">${Number(inv.amount).toLocaleString()}</span>
                                            </td>
                                            <td className="p-4 text-right hidden sm:table-cell">
                                                <span className="font-mono text-sm text-foreground">${currentVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                            </td>
                                            <td className="p-4 text-right hidden lg:table-cell">
                                                <span className={`font-mono text-sm ${returnAmt >= 0 ? "text-primary" : "text-destructive"}`}>
                                                    {returnAmt >= 0 ? "+" : ""}${returnAmt.toFixed(2)} ({returnPct}%)
                                                </span>
                                            </td>
                                            <td className="p-4 text-right hidden md:table-cell">
                                                {inv.ends_at ? (
                                                    <p className={`font-mono text-xs ${isUrgent ? "text-amber-400 font-bold" : "text-muted-foreground"}`}>
                                                        {daysLeft === 0 ? "Today ⚡" : daysLeft < 0 ? `${Math.abs(daysLeft!)}d overdue` : `${daysLeft}d`}
                                                    </p>
                                                ) : <span className="text-muted-foreground">—</span>}
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className={`font-mono text-xs px-2 py-0.5 rounded-pill capitalize ${statusColors[inv.status] || statusColors.active}`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                {inv.status === "active" && (
                                                    <button onClick={() => { setSelected(inv); setNewValue(String(inv.current_value || inv.amount)); setNotes(""); }}
                                                        className="p-1.5 rounded-lg bg-accent-dim text-primary hover:bg-primary hover:text-primary-foreground transition-colors" title="Manage">
                                                        <TrendingUp size={13} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={8} className="p-12 text-center font-body text-sm text-muted-foreground">No investments found</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </motion.div>
            </div>

            {/* Manage Investment Dialog */}
            <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
                <DialogContent className="bg-card border-border max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-foreground">
                            Manage Investment
                        </DialogTitle>
                    </DialogHeader>

                    {selected && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left: Details */}
                            <div className="space-y-4">
                                {/* Investment summary */}
                                <div className="bg-secondary rounded-lg p-4 space-y-2.5">
                                    <h4 className="font-body text-xs text-muted-foreground uppercase tracking-wide">Investment Details</h4>
                                    {[
                                        { label: "Plan", value: selected.investment_plans?.name || "—" },
                                        { label: "Amount Invested", value: `$${Number(selected.amount).toLocaleString()}` },
                                        { label: "Started", value: new Date(selected.started_at).toLocaleDateString("en-US", { dateStyle: "medium" }) },
                                        { label: "Matures", value: selected.ends_at ? new Date(selected.ends_at).toLocaleDateString("en-US", { dateStyle: "medium" }) : "—" },
                                        { label: "Days Left", value: selected.ends_at ? `${getDaysLeft(selected.ends_at)} days` : "—" },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="flex justify-between items-center gap-3">
                                            <span className="font-body text-xs text-muted-foreground">{label}</span>
                                            <span className="font-mono text-xs text-foreground">{value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* User info */}
                                {selectedProfile && (
                                    <div className="bg-secondary rounded-lg p-4">
                                        <h4 className="font-body text-xs text-muted-foreground uppercase tracking-wide mb-2">Investor</h4>
                                        <p className="font-body text-sm font-medium text-foreground">{selectedProfile.display_name}</p>
                                        <p className="font-mono text-[10px] text-muted-foreground">{selectedProfile.email}</p>
                                        <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-1.5">
                                            <DollarSign size={11} className="text-muted-foreground" />
                                            <span className="font-body text-xs text-muted-foreground">Current balance:</span>
                                            <span className="font-mono text-xs text-primary">${Number(selectedProfile.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: Actions */}
                            <div className="space-y-4">
                                {/* Set current value (ROI) */}
                                <div className="bg-secondary rounded-lg p-4">
                                    <h4 className="font-body text-xs text-muted-foreground uppercase tracking-wide mb-3">Update Return Value</h4>
                                    <Label className="font-body text-xs text-muted-foreground mb-1.5 block">
                                        Current Value (invested + returns)
                                    </Label>
                                    <div className="relative mb-2">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground text-sm">$</span>
                                        <Input
                                            type="number"
                                            value={newValue}
                                            onChange={(e) => setNewValue(e.target.value)}
                                            className="pl-7 bg-input border-border text-foreground font-mono text-lg"
                                            step="0.01"
                                        />
                                    </div>
                                    {/* Projected return display */}
                                    <div className={`flex justify-between items-center px-3 py-2 rounded-lg ${currentReturn >= 0 ? "bg-accent-dim/30" : "bg-destructive/10"}`}>
                                        <span className="font-body text-xs text-muted-foreground">Return on Investment</span>
                                        <span className={`font-mono text-sm font-bold ${currentReturn >= 0 ? "text-primary" : "text-destructive"}`}>
                                            {currentReturn >= 0 ? "+" : ""}${currentReturn.toFixed(2)}
                                            {" "}({selected.amount > 0 ? ((currentReturn / selected.amount) * 100).toFixed(1) : "0"}%)
                                        </span>
                                    </div>
                                    <Button variant="outline" className="w-full mt-3" onClick={handleUpdateValue} disabled={actionLoading || !newValue}>
                                        <Clock size={13} className="mr-1" />
                                        Save Value (Keep Active)
                                    </Button>
                                </div>

                                {/* Admin notes */}
                                <div>
                                    <Label className="font-body text-sm text-muted-foreground mb-1.5 block">Notes to User (optional)</Label>
                                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                                        placeholder="e.g. Market performance note..." className="bg-input border-border text-foreground resize-none" />
                                </div>

                                {/* Expected range hint */}
                                {selected.investment_plans && (
                                    <div className="bg-secondary rounded-lg px-3 py-2">
                                        <p className="font-body text-xs text-muted-foreground">
                                            Plan target: <span className="text-foreground font-medium">{selected.investment_plans.expected_return_min}–{selected.investment_plans.expected_return_max}%</span>
                                            {" "}= <span className="text-primary font-mono">
                                                ${(Number(selected.amount) * (selected.investment_plans.expected_return_min / 100) + Number(selected.amount)).toFixed(2)}
                                                –${(Number(selected.amount) * (selected.investment_plans.expected_return_max / 100) + Number(selected.amount)).toFixed(2)}
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t border-border/30">
                        <Button variant="outline" onClick={() => setSelected(null)} className="sm:mr-auto">Close</Button>
                        <Button
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            onClick={() => handleAction("cancelled")}
                            disabled={actionLoading}
                        >
                            <XCircle size={13} className="mr-1" />
                            {actionLoading ? "..." : "Cancel & Refund"}
                        </Button>
                        <Button variant="hero" onClick={() => handleAction("completed")} disabled={actionLoading}>
                            <CheckCircle size={13} className="mr-1" />
                            {actionLoading ? "Processing..." : `Complete & Credit $${(Number(newValue) || (selected?.current_value || selected?.amount) || 0).toLocaleString()}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
};

export default AdminInvestments;
