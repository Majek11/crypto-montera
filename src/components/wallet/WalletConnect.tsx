import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Zap, CheckCircle2, ExternalLink, AlertCircle, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WalletConnectProps {
    onConnected: () => void;
}

interface DetectedWallet {
    id: string;
    name: string;
    icon: string;
    chain: string;
    description: string;
    detected: boolean;
    installUrl: string;
}

const SUPPORTED_WALLETS: DetectedWallet[] = [
    {
        id: "metamask",
        name: "MetaMask",
        icon: "🦊",
        chain: "ethereum",
        description: "Most popular Ethereum wallet",
        detected: typeof window !== "undefined" && !!(window as any).ethereum?.isMetaMask,
        installUrl: "https://metamask.io/download/",
    },
    {
        id: "coinbase",
        name: "Coinbase Wallet",
        icon: "🔵",
        chain: "ethereum",
        description: "Easy to use, beginner friendly",
        detected: typeof window !== "undefined" && !!(window as any).ethereum?.isCoinbaseWallet,
        installUrl: "https://www.coinbase.com/wallet/downloads",
    },
    {
        id: "phantom",
        name: "Phantom",
        icon: "👻",
        chain: "solana",
        description: "Leading Solana wallet",
        detected: typeof window !== "undefined" && !!(window as any).solana?.isPhantom,
        installUrl: "https://phantom.app/download",
    },
    {
        id: "trust",
        name: "Trust Wallet",
        icon: "🛡️",
        chain: "bsc",
        description: "Multi-chain mobile wallet",
        detected: typeof window !== "undefined" && !!(window as any).trustwallet,
        installUrl: "https://trustwallet.com/download",
    },
];

const CONNECT_BONUS = 25; // USD bonus for connecting a wallet

/**
 * Attempts to get the active address from an EVM wallet (MetaMask/Coinbase).
 */
async function connectEVM(): Promise<string> {
    const eth = (window as any).ethereum;
    if (!eth) throw new Error("No EVM wallet detected.");
    const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
    if (!accounts[0]) throw new Error("No account returned.");
    return accounts[0];
}

/**
 * Attempts to get the public key from a Solana wallet (Phantom).
 */
async function connectSolana(): Promise<string> {
    const sol = (window as any).solana;
    if (!sol) throw new Error("No Solana wallet detected.");
    const response = await sol.connect();
    return response.publicKey.toString();
}

const WalletConnect = ({ onConnected }: WalletConnectProps) => {
    const { user } = useAuth();
    const [connecting, setConnecting] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const [connectedAddress, setConnectedAddress] = useState("");
    const [connectedWalletName, setConnectedWalletName] = useState("");

    const handleConnect = async (wallet: DetectedWallet) => {
        if (!wallet.detected) {
            window.open(wallet.installUrl, "_blank");
            return;
        }

        setConnecting(wallet.id);
        try {
            let address = "";
            if (wallet.id === "phantom") {
                address = await connectSolana();
            } else {
                address = await connectEVM();
            }

            if (!user) throw new Error("Not authenticated");

            // Check if this address is already saved
            const { data: existing } = await supabase
                .from("wallets")
                .select("id")
                .eq("user_id", user.id)
                .eq("address", address)
                .maybeSingle();

            if (existing) {
                toast.info("This wallet is already connected to your account.");
                setConnecting(null);
                return;
            }

            // Check if user already has wallets (to set is_primary)
            const { data: allWallets } = await supabase
                .from("wallets")
                .select("id")
                .eq("user_id", user.id);
            const isPrimary = !allWallets || allWallets.length === 0;

            // Save wallet to DB
            const { error: walletError } = await supabase.from("wallets").insert({
                user_id: user.id,
                address,
                label: `${wallet.name} Wallet`,
                chain: wallet.chain,
                is_primary: isPrimary,
                balance: 0,
            });
            if (walletError) throw walletError;

            // Award connection bonus as a transaction
            await supabase.from("transactions").insert({
                user_id: user.id,
                type: "return",
                amount: CONNECT_BONUS,
                currency: "USD",
                status: "completed",
                description: `🎁 Wallet Connection Bonus — ${wallet.name}`,
                reference: `wallet-bonus-${wallet.id}-${Date.now()}`,
            });

            // Send a notification
            await supabase.from("notifications").insert({
                user_id: user.id,
                title: "🎉 Wallet Connected!",
                message: `Your ${wallet.name} wallet was connected and you received a $${CONNECT_BONUS} welcome bonus!`,
                type: "success",
            });

            setConnectedAddress(address);
            setConnectedWalletName(wallet.name);
            setConnected(true);
            toast.success(`${wallet.name} connected! $${CONNECT_BONUS} bonus credited.`);
            onConnected();
        } catch (err: any) {
            toast.error(err.message || "Failed to connect wallet");
        } finally {
            setConnecting(null);
        }
    };

    if (connected) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-accent-dim border border-primary/30 rounded-xl p-6 text-center"
            >
                <CheckCircle2 size={36} className="text-primary mx-auto mb-3" />
                <h3 className="font-heading font-bold text-lg text-foreground mb-1">
                    {connectedWalletName} Connected!
                </h3>
                <p className="font-mono text-xs text-muted-foreground mb-3 break-all">
                    {connectedAddress.slice(0, 8)}...{connectedAddress.slice(-8)}
                </p>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/30 rounded-lg px-4 py-2 font-body text-sm font-medium">
                    <Gift size={14} />
                    ${CONNECT_BONUS} wallet connection bonus credited!
                </div>
            </motion.div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Bonus banner */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-primary/10 to-amber-400/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3"
            >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Gift size={18} className="text-primary" />
                </div>
                <div>
                    <p className="font-heading font-bold text-sm text-foreground">
                        Connect wallet & earn ${CONNECT_BONUS} bonus
                    </p>
                    <p className="font-body text-xs text-muted-foreground mt-0.5">
                        Instantly credited to your account when you connect any supported wallet
                    </p>
                </div>
                <Zap size={20} className="text-amber-400 shrink-0 animate-pulse-glow" />
            </motion.div>

            {/* Wallet list */}
            <div className="grid gap-3">
                {SUPPORTED_WALLETS.map((wallet, i) => (
                    <motion.button
                        key={wallet.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        onClick={() => handleConnect(wallet)}
                        disabled={connecting === wallet.id}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group ${wallet.detected
                                ? "border-primary/30 bg-accent-dim/30 hover:bg-accent-dim hover:border-primary/60"
                                : "border-border bg-card hover:border-border-light hover:bg-card-hover"
                            }`}
                    >
                        <span className="text-2xl">{wallet.icon}</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="font-body text-sm font-medium text-foreground">{wallet.name}</p>
                                {wallet.detected && (
                                    <span className="font-mono text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded">
                                        Detected
                                    </span>
                                )}
                            </div>
                            <p className="font-body text-xs text-muted-foreground">{wallet.description}</p>
                        </div>

                        {connecting === wallet.id ? (
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                        ) : wallet.detected ? (
                            <Wallet size={16} className="text-primary shrink-0 group-hover:scale-110 transition-transform" />
                        ) : (
                            <ExternalLink size={14} className="text-muted-foreground shrink-0" />
                        )}
                    </motion.button>
                ))}
            </div>

            {/* No wallets detected notice */}
            {!SUPPORTED_WALLETS.some((w) => w.detected) && (
                <div className="flex items-start gap-2 p-3 bg-amber-400/5 border border-amber-400/20 rounded-lg">
                    <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="font-body text-xs text-muted-foreground">
                        No browser wallet detected. Click any wallet above to install it, then return here to connect.
                    </p>
                </div>
            )}
        </div>
    );
};

export default WalletConnect;
