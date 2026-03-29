import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, TrendingUp, Search, Plus, DollarSign, Percent, PiggyBank, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import type { Profile } from "@/types";

type BonusType = "cash" | "investment_return";

interface BonusDialog {
    open: boolean;
    user: Profile | null;
    type: BonusType;
}

const AdminBonus = () => {
    const { user: adminUser } = useAuth();
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [dialog, setDialog] = useState<BonusDialog>({ open: false, user: null, type: "cash" });
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [recentBonuses, setRecentBonuses] = useState<any[]>([]);
    const [userBalance, setUserBalance] = useState<number | null>(null);
    const [loadingBalance, setLoadingBalance] = useState(false);

    const fetchUsers = async () => {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) toast.error("Failed to load users");
        else setUsers(data ?? []);
        setLoading(false);
    };

    const fetchRecentBonuses = async () => {
        const { data } = await supabase
            .from("transactions")
            .select("*, profiles!transactions_user_id_fkey(display_name, email)")
            .ilike("description", "%bonus%")
            .order("created_at", { ascending: false })
            .limit(10);
        setRecentBonuses(data ?? []);
    };

    useEffect(() => {
        fetchUsers();
        fetchRecentBonuses();
    }, []);

    const openDialog = async (user: Profile, type: BonusType) => {
        setAmount("");
        setNote("");
        setUserBalance(null);
        setDialog({ open: true, user, type });

        // Fetch live wallet balance for this user
        setLoadingBalance(true);
        const { data } = await supabase
            .from("transactions")
            .select("amount, type")
            .eq("user_id", user.user_id)
            .eq("status", "completed");

        if (data) {
            const bal = data.reduce((acc, tx) => {
                const amt = Number(tx.amount);
                if (tx.type === "deposit" || tx.type === "return") return acc + amt;
                if (tx.type === "withdrawal" || tx.type === "investment" || tx.type === "fee") return acc - amt;
                return acc;
            }, 0);
            setUserBalance(Math.max(0, bal));
        }
        setLoadingBalance(false);
    };

    const submitBonus = async () => {
        if (!dialog.user || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }
        setSubmitting(true);

        const amountNum = Number(amount);
        const isCash = dialog.type === "cash";
        const description = note.trim() || (isCash ? "💰 Admin Cash Bonus" : "📈 Admin Investment Return Bonus");

        // Insert transaction
        const { error: txError } = await supabase.from("transactions").insert({
            user_id: dialog.user.user_id,
            type: "return",
            amount: amountNum,
            currency: "USD",
            status: "completed",
            description,
            reference: `admin-bonus-${isCash ? "cash" : "investment"}-${Date.now()}`,
        });

        if (txError) { toast.error(txError.message); setSubmitting(false); return; }

        // If investment bonus — also update an active investment's current_value
        if (!isCash) {
            const { data: investments } = await supabase
                .from("investments")
                .select("id, current_value")
                .eq("user_id", dialog.user.user_id)
                .eq("status", "active")
                .order("amount", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (investments) {
                await supabase
                    .from("investments")
                    .update({ current_value: (investments.current_value ?? 0) + amountNum })
                    .eq("id", investments.id);
            }
        }

        // Notify the user
        await supabase.from("notifications").insert({
            user_id: dialog.user.user_id,
            title: isCash ? "💰 You received a bonus!" : "📈 Investment return credited!",
            message: `$${amountNum.toLocaleString("en-US", { minimumFractionDigits: 2 })} has been credited to your account. ${note ? `Note: ${note}` : ""}`,
            type: "success",
        });

        toast.success(`$${amountNum.toLocaleString()} bonus credited to ${dialog.user.display_name || dialog.user.email}`);
        setDialog({ open: false, user: null, type: "cash" });
        fetchRecentBonuses();
        setSubmitting(false);
    };

    const filtered = users.filter((u) => {
        const q = search.toLowerCase();
        return (
            !q ||
            (u.display_name ?? "").toLowerCase().includes(q) ||
            (u.email ?? "").toLowerCase().includes(q)
        );
    });

    return (
        <AdminLayout>
            <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="font-heading font-bold text-3xl text-foreground mb-1 flex items-center gap-3">
                        <Gift size={28} className="text-primary" />
                        Bonus Management
                    </h1>
                    <p className="font-body text-sm text-muted-foreground">
                        Credit cash bonuses or investment return bonuses to any user account instantly
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: User list */}
                    <div className="lg:col-span-2">
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-border">
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search users by name or email..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9 font-body text-sm"
                                    />
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center h-40">
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
                                    {filtered.map((u) => (
                                        <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-card-hover transition-colors">
                                            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                                                <span className="text-primary font-heading font-bold text-sm">
                                                    {(u.display_name || u.email || "U")[0]?.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-body text-sm font-medium text-foreground truncate">
                                                    {u.display_name || "Unnamed"}
                                                </p>
                                                <p className="font-mono text-xs text-muted-foreground truncate">{u.email}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-1 text-xs h-8 border-primary/30 text-primary hover:bg-accent-dim"
                                                    onClick={() => openDialog(u, "cash")}
                                                    title="Add cash bonus"
                                                >
                                                    <DollarSign size={12} />
                                                    Cash
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-1 text-xs h-8 border-amber-400/30 text-amber-400 hover:bg-amber-400/10"
                                                    onClick={() => openDialog(u, "investment_return")}
                                                    title="Add investment return"
                                                >
                                                    <TrendingUp size={12} />
                                                    Return
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {filtered.length === 0 && (
                                        <p className="font-body text-sm text-muted-foreground text-center py-12">
                                            No users found matching "{search}"
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Recent bonuses */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                                <PiggyBank size={15} className="text-primary" />
                                Recent Bonuses
                            </h3>
                        </div>
                        <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
                            {recentBonuses.length === 0 ? (
                                <p className="font-body text-xs text-muted-foreground text-center py-8">No bonuses issued yet</p>
                            ) : (
                                recentBonuses.map((tx) => (
                                    <div key={tx.id} className="px-4 py-3">
                                        <p className="font-body text-xs font-medium text-foreground truncate">
                                            {(tx.profiles as any)?.display_name || (tx.profiles as any)?.email || "Unknown"}
                                        </p>
                                        <p className="font-mono text-xs text-primary font-bold">
                                            +${Number(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                        </p>
                                        <p className="font-body text-[10px] text-muted-foreground mt-0.5 truncate">{tx.description}</p>
                                        <p className="font-mono text-[10px] text-muted-foreground">
                                            {new Date(tx.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bonus dialog */}
            <AnimatePresence>
                {dialog.open && dialog.user && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
                            onClick={() => setDialog({ open: false, user: null, type: "cash" })}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -8 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 px-4"
                        >
                            <div className="bg-card border border-border rounded-xl p-6 shadow-2xl">
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-5">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dialog.type === "cash" ? "bg-primary/15" : "bg-amber-400/15"}`}>
                                        {dialog.type === "cash" ? (
                                            <DollarSign size={18} className="text-primary" />
                                        ) : (
                                            <TrendingUp size={18} className="text-amber-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="font-heading font-bold text-lg text-foreground">
                                            {dialog.type === "cash" ? "Cash Bonus" : "Investment Return Bonus"}
                                        </h2>
                                        <p className="font-body text-xs text-muted-foreground">
                                            For: <span className="text-foreground">{dialog.user.display_name || dialog.user.email}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* User's current wallet balance */}
                                <div className="bg-secondary border border-border rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-body text-xs text-muted-foreground">Current Wallet Balance</p>
                                        <p className="font-body text-xs text-primary/60 mt-0.5">
                                            {dialog.user.display_name || dialog.user.email}
                                        </p>
                                    </div>
                                    {loadingBalance ? (
                                        <Loader2 size={15} className="animate-spin text-muted-foreground" />
                                    ) : (
                                        <p className="font-mono text-lg font-bold text-foreground">
                                            ${(userBalance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    )}
                                </div>

                                {/* Type description */}
                                <div className={`p-3 rounded-lg mb-4 text-xs font-body ${dialog.type === "cash" ? "bg-primary/5 border border-primary/20 text-primary" : "bg-amber-400/5 border border-amber-400/20 text-amber-400"}`}>
                                    {dialog.type === "cash"
                                        ? "💰 Credited directly as a completed transaction. Appears in the user's wallet balance and transaction history."
                                        : "📈 Credited as an investment return and also increases the value of the user's largest active investment."}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Label className="font-body text-sm text-muted-foreground">Amount (USD)</Label>
                                        <div className="relative mt-1.5">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">$</span>
                                            <Input
                                                type="number"
                                                min="1"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="pl-7 font-mono text-sm"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="font-body text-sm text-muted-foreground">Note (optional)</Label>
                                        <Textarea
                                            className="mt-1.5 font-body text-sm"
                                            rows={2}
                                            placeholder="e.g. Referral bonus, promotional credit..."
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-5">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setDialog({ open: false, user: null, type: "cash" })}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant={dialog.type === "cash" ? "hero" : "outline"}
                                        className={`flex-1 gap-2 ${dialog.type === "investment_return" ? "border-amber-400/50 text-amber-400 hover:bg-amber-400/10" : ""}`}
                                        onClick={submitBonus}
                                        disabled={submitting || !amount}
                                    >
                                        {submitting ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Plus size={14} />
                                        )}
                                        {submitting ? "Crediting..." : `Credit $${amount || "0"}`}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
};

export default AdminBonus;
