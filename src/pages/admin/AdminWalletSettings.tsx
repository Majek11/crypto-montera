import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, RefreshCw, Wallet, AlertCircle, CheckCircle2, Copy, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import { CHAINS, PLATFORM_DEPOSIT_ADDRESSES, WALLET_META } from "@/lib/constants";

interface WalletRow {
    chainId: string;
    chainName: string;
    chainSymbol: string;
    chainColor: string;
    dbKey: string;
    live: string;   // value last saved to DB (or fallback)
    draft: string;   // value in the input right now
    saving: boolean;
}

const AdminWalletSettings = () => {
    const [rows, setRows] = useState<WalletRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [dbAvailable, setDbAvailable] = useState(true);

    // ── Helpers ────────────────────────────────────────────────────────────────

    const buildRows = (dbMap: Record<string, string>): WalletRow[] =>
        CHAINS.map((chain) => ({
            chainId: chain.id,
            chainName: chain.name,
            chainSymbol: chain.symbol,
            chainColor: chain.color,
            dbKey: `wallet_${chain.id}`,
            live: dbMap[chain.id] ?? PLATFORM_DEPOSIT_ADDRESSES[chain.id] ?? "",
            draft: dbMap[chain.id] ?? PLATFORM_DEPOSIT_ADDRESSES[chain.id] ?? "",
            saving: false,
        }));

    const fetchFromDB = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from("platform_settings")
                .select("key, value")
                .like("key", "wallet_%");

            if (error) throw error;

            const dbMap: Record<string, string> = {};
            (data ?? []).forEach((r: { key: string; value: string }) => {
                const chainId = r.key.replace("wallet_", "");
                dbMap[chainId] = r.value;
            });

            setRows(buildRows(dbMap));
            setDbAvailable(true);
        } catch {
            // Table may not exist yet — fall back to constants
            setRows(buildRows({}));
            setDbAvailable(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchFromDB(); }, []);

    // ── Actions ────────────────────────────────────────────────────────────────

    const updateDraft = (chainId: string, value: string) =>
        setRows((prev) =>
            prev.map((r) => (r.chainId === chainId ? { ...r, draft: value } : r))
        );

    const handleSave = async (chainId: string) => {
        const row = rows.find((r) => r.chainId === chainId);
        if (!row) return;
        const value = row.draft.trim();
        if (!value) { toast.error("Address cannot be empty"); return; }

        setRows((prev) =>
            prev.map((r) => (r.chainId === chainId ? { ...r, saving: true } : r))
        );

        const { error } = await (supabase as any)
            .from("platform_settings")
            .upsert(
                { key: row.dbKey, value, updated_at: new Date().toISOString() },
                { onConflict: "key" }
            );

        if (error) {
            toast.error("Save failed: " + error.message);
            setRows((prev) =>
                prev.map((r) => (r.chainId === chainId ? { ...r, saving: false } : r))
            );
        } else {
            toast.success(`${row.chainName} address updated!`);
            setRows((prev) =>
                prev.map((r) =>
                    r.chainId === chainId ? { ...r, live: value, saving: false } : r
                )
            );
        }
    };

    const handleCopy = (addr: string) => {
        navigator.clipboard.writeText(addr);
        toast.success("Copied to clipboard");
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <AdminLayout>
            <div className="p-6 lg:p-8 max-w-4xl mx-auto">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-6"
                >
                    <div>
                        <h1 className="font-heading font-bold text-3xl text-foreground mb-1">
                            Wallet Settings
                        </h1>
                        <p className="font-body text-sm text-muted-foreground">
                            Manage the crypto addresses users send deposits to. Changes take effect immediately.
                        </p>
                    </div>
                    <Button variant="outline" onClick={fetchFromDB} className="gap-2 shrink-0">
                        <RefreshCw size={14} /> Refresh
                    </Button>
                </motion.div>

                {/* DB not available warning */}
                {!loading && !dbAvailable && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-4 mb-6 flex gap-3"
                    >
                        <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-heading font-bold text-sm text-foreground mb-1">
                                Database table not set up yet
                            </p>
                            <p className="font-body text-xs text-muted-foreground">
                                Run{" "}
                                <code className="bg-secondary px-1 py-0.5 rounded font-mono text-[11px]">
                                    supabase/WALLET_SETTINGS_MIGRATION.sql
                                </code>{" "}
                                in your Supabase SQL Editor to enable dynamic address management.
                                Addresses shown below are the code-level fallbacks.
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Info banner */}
                {!loading && dbAvailable && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-accent-dim/30 border border-primary/20 rounded-lg p-4 mb-6 flex gap-3"
                    >
                        <Info size={15} className="text-primary shrink-0 mt-0.5" />
                        <p className="font-body text-xs text-muted-foreground">
                            Saved addresses are stored in Supabase and picked up live by the Deposit page —
                            no deployment needed.  Only send address changes to your users after confirming funds arrive correctly.
                        </p>
                    </motion.div>
                )}

                {/* Wallet rows */}
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-card border border-border rounded-lg h-32 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {rows.map((row, i) => {
                            const isDirty = row.draft !== row.live;
                            const meta = WALLET_META[row.chainId];

                            return (
                                <motion.div
                                    key={row.chainId}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-card border border-border hover:border-border-light rounded-xl p-5 transition-colors"
                                >
                                    {/* Chain header */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${row.chainColor}`}>
                                            <Wallet size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-heading font-bold text-base text-foreground">
                                                    {meta?.label ?? row.chainName}
                                                </h3>
                                                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${row.chainColor}`}>
                                                    {row.chainSymbol}
                                                </span>
                                            </div>
                                            {meta?.note && (
                                                <p className="font-body text-xs text-muted-foreground mt-0.5">{meta.note}</p>
                                            )}
                                        </div>
                                        {row.live && (
                                            <button
                                                onClick={() => handleCopy(row.live)}
                                                title="Copy current live address"
                                                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Input + Save */}
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            value={row.draft}
                                            onChange={(e) => updateDraft(row.chainId, e.target.value)}
                                            placeholder={`Enter ${row.chainSymbol} address…`}
                                            className="flex-1 bg-input border-border text-foreground font-mono text-xs"
                                        />
                                        <Button
                                            variant={isDirty ? "hero" : "outline"}
                                            onClick={() => handleSave(row.chainId)}
                                            disabled={row.saving || !isDirty || !dbAvailable}
                                            className="gap-2 min-w-[90px] shrink-0"
                                        >
                                            {row.saving ? (
                                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            ) : isDirty ? (
                                                <><Save size={13} /> Save</>
                                            ) : (
                                                <><CheckCircle2 size={13} /> Saved</>
                                            )}
                                        </Button>
                                    </div>

                                    {/* Live address preview */}
                                    {row.live && (
                                        <p className="font-mono text-[10px] text-muted-foreground mt-2 break-all">
                                            <span className="text-primary/60">Live: </span>{row.live}
                                        </p>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminWalletSettings;
