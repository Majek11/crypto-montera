import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard, TrendingUp, History, Wallet, FileCheck,
    Activity, Settings, ArrowDownLeft, ArrowUpRight, ShieldCheck,
    Search, LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

interface Command {
    id: string;
    label: string;
    description?: string;
    icon: React.ElementType;
    action: () => void;
    group: string;
    keywords?: string;
}

interface CommandPaletteProps {
    open: boolean;
    onClose: () => void;
}

const CommandPalette = ({ open, onClose }: CommandPaletteProps) => {
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const { isAdmin } = useUserRole();
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);

    const go = useCallback(
        (path: string) => {
            navigate(path);
            onClose();
        },
        [navigate, onClose]
    );

    const commands: Command[] = [
        { id: "dashboard", label: "Dashboard", description: "Your portfolio overview", icon: LayoutDashboard, action: () => go("/dashboard"), group: "Navigate" },
        { id: "plans", label: "Investment Plans", description: "Browse and subscribe to plans", icon: TrendingUp, action: () => go("/plans"), group: "Navigate" },
        { id: "transactions", label: "Transactions", description: "Full transaction history", icon: History, action: () => go("/transactions"), group: "Navigate" },
        { id: "wallets", label: "Wallets", description: "Manage connected wallets", icon: Wallet, action: () => go("/wallets"), group: "Navigate" },
        { id: "deposit", label: "Deposit Funds", description: "Add funds to your account", icon: ArrowDownLeft, action: () => go("/deposit"), group: "Actions", keywords: "add money crypto" },
        { id: "withdraw", label: "Withdraw Funds", description: "Send funds to an external wallet", icon: ArrowUpRight, action: () => go("/withdraw"), group: "Actions" },
        { id: "kyc", label: "KYC Verification", description: "Verify your identity", icon: FileCheck, action: () => go("/kyc"), group: "Account" },
        { id: "activity", label: "Activity Log", description: "Security and account activity", icon: Activity, action: () => go("/activity"), group: "Account" },
        { id: "settings", label: "Settings", description: "Profile and security settings", icon: Settings, action: () => go("/settings"), group: "Account" },
        ...(isAdmin
            ? [{ id: "admin", label: "Admin Panel", description: "Platform administration", icon: ShieldCheck, action: () => go("/admin"), group: "Admin" }]
            : []),
        {
            id: "signout",
            label: "Sign Out",
            icon: LogOut,
            action: async () => {
                await signOut();
                toast.success("Signed out");
                navigate("/");
                onClose();
            },
            group: "Account",
        },
    ];

    const filtered = query.trim()
        ? commands.filter((c) => {
            const q = query.toLowerCase();
            return (
                c.label.toLowerCase().includes(q) ||
                (c.description ?? "").toLowerCase().includes(q) ||
                (c.keywords ?? "").toLowerCase().includes(q) ||
                c.group.toLowerCase().includes(q)
            );
        })
        : commands;

    // Group the filtered results
    const groups = Array.from(new Set(filtered.map((c) => c.group)));

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
        if (!open) {
            setQuery("");
            setSelectedIndex(0);
        }
    }, [open]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (!open) return;
            if (e.key === "Escape") { onClose(); return; }
            if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
            if (e.key === "Enter" && filtered[selectedIndex]) { filtered[selectedIndex].action(); }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, filtered, selectedIndex, onClose]);

    let globalIndex = 0;

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -8 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="fixed top-[15vh] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 px-4"
                    >
                        <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                            {/* Search input */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                                <Search size={16} className="text-muted-foreground shrink-0" />
                                <input
                                    autoFocus
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Type a command or search..."
                                    className="flex-1 bg-transparent font-body text-sm text-foreground placeholder:text-muted-foreground outline-none"
                                />
                                <kbd className="font-mono text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">ESC</kbd>
                            </div>

                            {/* Results */}
                            <div className="max-h-[60vh] overflow-y-auto py-1">
                                {filtered.length === 0 ? (
                                    <p className="font-body text-sm text-muted-foreground text-center py-8">
                                        No commands found for "{query}"
                                    </p>
                                ) : (
                                    groups.map((group) => {
                                        const groupItems = filtered.filter((c) => c.group === group);
                                        return (
                                            <div key={group}>
                                                <p className="font-mono text-[10px] text-muted-foreground px-4 pt-3 pb-1 uppercase tracking-wider">
                                                    {group}
                                                </p>
                                                {groupItems.map((cmd) => {
                                                    const idx = globalIndex++;
                                                    const isSelected = idx === selectedIndex;
                                                    return (
                                                        <button
                                                            key={cmd.id}
                                                            onClick={cmd.action}
                                                            onMouseEnter={() => setSelectedIndex(idx)}
                                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isSelected ? "bg-accent-dim" : "hover:bg-secondary"
                                                                }`}
                                                        >
                                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-primary/20" : "bg-secondary"
                                                                }`}>
                                                                <cmd.icon size={14} className={isSelected ? "text-primary" : "text-muted-foreground"} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`font-body text-sm font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                                                                    {cmd.label}
                                                                </p>
                                                                {cmd.description && (
                                                                    <p className="font-body text-xs text-muted-foreground truncate">{cmd.description}</p>
                                                                )}
                                                            </div>
                                                            {isSelected && (
                                                                <kbd className="font-mono text-[10px] text-primary border border-primary/30 rounded px-1.5 py-0.5 shrink-0">
                                                                    ↵
                                                                </kbd>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer */}
                            <div className="border-t border-border px-4 py-2 flex items-center gap-4">
                                <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                                    <kbd className="border border-border rounded px-1">↑↓</kbd> navigate
                                </span>
                                <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                                    <kbd className="border border-border rounded px-1">↵</kbd> select
                                </span>
                                <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                                    <kbd className="border border-border rounded px-1">esc</kbd> close
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;
