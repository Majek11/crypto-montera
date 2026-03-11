import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Users, Gift, TrendingUp, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ReferralStats {
    total: number;
    pending: number;
    completed: number;
    totalRewards: number;
}

const ReferralCard = () => {
    const { user } = useAuth();
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [stats, setStats] = useState<ReferralStats>({ total: 0, pending: 0, completed: 0, totalRewards: 0 });
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);

    const referralLink = referralCode
        ? `https://monteracrypto.com/signup?ref=${referralCode}`
        : "";

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            const [profileRes, referralsRes] = await Promise.all([
                supabase.from("profiles").select("referral_code").eq("user_id", user.id).single(),
                supabase.from("referrals").select("*").eq("referrer_id", user.id),
            ]);

            if (profileRes.data) setReferralCode(profileRes.data.referral_code);

            if (referralsRes.data) {
                const refs = referralsRes.data;
                setStats({
                    total: refs.length,
                    pending: refs.filter(r => r.status === "pending").length,
                    completed: refs.filter(r => r.status === "completed").length,
                    totalRewards: refs.reduce((s, r) => s + Number(r.reward_amount || 0), 0),
                });
            }
            setLoading(false);
        };
        fetchData();
    }, [user]);

    const copyLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast.success("Referral link copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    const shareLink = async () => {
        if (navigator.share) {
            await navigator.share({
                title: "Join Montera",
                text: "Join me on Montera — earn institutional-grade crypto returns with zero fees!",
                url: referralLink,
            });
        } else {
            copyLink();
        }
    };

    if (loading) {
        return <div className="bg-card border border-border rounded-lg p-6 h-48 animate-pulse" />;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center">
                    <Gift size={18} className="text-primary" />
                </div>
                <div>
                    <h3 className="font-heading font-bold text-base text-foreground">Referral Program</h3>
                    <p className="font-body text-xs text-muted-foreground">Invite friends and earn rewards together</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                    { label: "Total Referrals", value: stats.total, icon: Users, color: "text-foreground" },
                    { label: "Completed", value: stats.completed, icon: TrendingUp, color: "text-primary" },
                    { label: "Rewards Earned", value: `$${stats.totalRewards.toLocaleString()}`, icon: Gift, color: "text-primary" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-secondary rounded-lg p-3 text-center">
                        <stat.icon size={14} className={`mx-auto mb-1 ${stat.color}`} />
                        <p className={`font-mono text-base font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="font-body text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* How it works */}
            <div className="bg-accent-dim/30 border border-primary/15 rounded-lg p-3 mb-4">
                <p className="font-body text-xs text-muted-foreground leading-relaxed">
                    🎁 <span className="text-foreground font-medium">How it works:</span> Share your unique link. When a friend signs up and makes their first deposit, you both receive a reward credited to your accounts.
                </p>
            </div>

            {/* Referral Link */}
            {referralCode ? (
                <div>
                    <p className="font-body text-xs text-muted-foreground mb-2">Your referral link</p>
                    <div className="flex gap-2">
                        <div className="flex-1 flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 border border-border overflow-hidden">
                            <span className="font-mono text-xs text-primary font-medium flex-shrink-0">REF-{referralCode}</span>
                            <span className="font-mono text-xs text-muted-foreground truncate hidden sm:block">
                                · monteracrypto.com/signup?ref={referralCode}
                            </span>
                        </div>
                        <button
                            onClick={copyLink}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary border border-border hover:border-border-light text-muted-foreground hover:text-foreground transition-colors text-xs font-body"
                        >
                            {copied ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
                            {copied ? "Copied!" : "Copy"}
                        </button>
                        <button
                            onClick={shareLink}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-dim border border-primary/20 text-primary hover:bg-primary/20 transition-colors text-xs font-body"
                        >
                            <Share2 size={13} />
                            Share
                        </button>
                    </div>
                </div>
            ) : (
                <p className="font-body text-xs text-muted-foreground">Referral code not yet generated. Please refresh the page.</p>
            )}

            {/* Pending note */}
            {stats.pending > 0 && (
                <p className="font-body text-xs text-amber-400 mt-3">
                    ⏳ {stats.pending} referral{stats.pending > 1 ? "s" : ""} pending — awaiting their first deposit.
                </p>
            )}
        </motion.div>
    );
};

export default ReferralCard;
