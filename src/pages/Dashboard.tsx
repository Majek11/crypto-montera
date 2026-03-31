import { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Star, Wallet, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/layout/AppLayout";
import PortfolioChart from "@/components/dashboard/PortfolioChart";
import HoldingsTable from "@/components/dashboard/HoldingsTable";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { useInvestments } from "@/hooks/useInvestments";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import AnnouncementBanner from "@/components/features/AnnouncementBanner";

const StatCardSkeleton = () => (
  <div className="bg-card border border-border rounded-lg p-5 space-y-3">
    <Skeleton className="h-3 w-24" />
    <Skeleton className="h-7 w-32" />
    <Skeleton className="h-3 w-16" />
  </div>
);

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { effectiveUserId } = useImpersonation();
  const effectiveUid = effectiveUserId(user?.id);
  const { data: investments = [], isLoading: invLoading } = useInvestments();
  const { data: transactions = [], isLoading: txLoading } = useTransactions({ limit: 10 });
  const [availableBalance, setAvailableBalance] = useState(0);
  const [userProfit, setUserProfit] = useState(0);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to refresh balances
  const refreshBalances = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    if (!effectiveUid) return;
    
    const fetchBalanceAndProfit = async () => {
      try {
        // Try to get balance and profit from profiles
        const { data, error } = await supabase
          .from("profiles")
          .select("balance, profit")
          .eq("user_id", effectiveUid)
          .single();
        
        if (data) {
          setAvailableBalance(Number(data.balance) || 0);
          setUserProfit(Number(data.profit) || 0);
        } else if (error && error.code === '42703') {
          // Profit column doesn't exist, get balance and calculate profit from transactions
          const { data: balanceData } = await supabase
            .from("profiles")
            .select("balance")
            .eq("user_id", effectiveUid)
            .single();
          
          setAvailableBalance(balanceData ? Number(balanceData.balance) : 0);
          
          // Calculate profit from transactions
          const { data: profitTxs } = await supabase
            .from("transactions")
            .select("amount")
            .eq("user_id", effectiveUid)
            .eq("status", "completed")
            .in("type", ["return", "profit"]);
          
          const calculatedProfit = profitTxs ? profitTxs.reduce((sum, tx) => sum + Number(tx.amount), 0) : 0;
          setUserProfit(calculatedProfit);
        }
      } catch (err) {
        console.error("Error fetching balance and profit:", err);
        setAvailableBalance(0);
        setUserProfit(0);
      }
    };
    
    fetchBalanceAndProfit();
    supabase.from("kyc_verifications")
      .select("status")
      .eq("user_id", effectiveUid)
      .order("created_at", { ascending: false })
      .limit(1).maybeSingle()
      .then(({ data }) => setKycStatus((data as any)?.status || "pending"));
  }, [effectiveUid, refreshKey]);

  const loading = invLoading || txLoading;

  const stats = useMemo(() => {
    const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
    const totalInvestmentValue = investments.reduce((s, i) => s + (i.current_value ?? i.amount), 0);
    const investmentReturns = investments.reduce((s, i) => s + (i.total_return ?? 0), 0);
    
    // Total P&L = Investment returns + Admin-given profits
    const totalPnL = investmentReturns + userProfit;
    const pnlPercent = totalInvested > 0 ? ((investmentReturns / totalInvested) * 100).toFixed(2) : "0.00";
    
    // Portfolio Value = Available Balance + Current Investment Value + Total P&L
    const portfolioValue = availableBalance + totalInvestmentValue + userProfit;

    let bestPlanName = "—";
    let bestReturn = -Infinity;
    for (const inv of investments) {
      const ret = inv.total_return ?? 0;
      if (ret > bestReturn) {
        bestReturn = ret;
        bestPlanName = (inv as any).investment_plans?.name ?? "—";
      }
    }

    return { 
      totalInvested, 
      totalInvestmentValue, 
      portfolioValue, 
      totalPnL, 
      pnlPercent, 
      bestPlanName, 
      bestReturn 
    };
  }, [investments, availableBalance, userProfit]);

  const statCards = [
    {
      label: t("dashboard.portfolioValue"),
      value: `$${stats.portfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      sub: t("dashboard.invested", { amount: stats.totalInvested.toLocaleString("en-US", { minimumFractionDigits: 2 }) }),
      icon: TrendingUp,
      positive: true,
    },
    {
      label: t("dashboard.totalPnl"),
      value: `${stats.totalPnL >= 0 ? "+" : "-"}$${Math.abs(stats.totalPnL).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      sub: t("dashboard.allTime", { percent: `${stats.totalPnL >= 0 ? "+" : ""}${stats.pnlPercent}` }),
      icon: stats.totalPnL >= 0 ? ArrowUpRight : ArrowDownRight,
      positive: stats.totalPnL >= 0,
    },
    {
      label: "Available Balance",
      value: `$${availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      sub: "Ready to invest",
      icon: Wallet,
      positive: true,
    },
    {
      label: t("dashboard.bestPerformer"),
      value: stats.bestPlanName,
      sub: stats.bestReturn > 0
        ? t("dashboard.returnAmount", { amount: stats.bestReturn.toLocaleString("en-US", { minimumFractionDigits: 2 }) })
        : t("dashboard.noReturnsYet"),
      icon: Star,
      positive: true,
    },
  ];

  return (
    <AppLayout>
      <SEO title={t("dashboard.title")} description="Your live crypto portfolio — balance, investments, recent transactions, and performance chart." noIndex />
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-heading font-bold text-3xl text-foreground mb-1">{t("dashboard.title")}</h1>
          <p className="font-body text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
        </motion.div>

        {/* Platform Announcements */}
        <AnnouncementBanner />

        {/* KYC Banner — always visible until approved */}
        {kycStatus && kycStatus !== "approved" && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className={`border rounded-lg p-4 flex items-start gap-3 ${kycStatus === "submitted" || kycStatus === "under_review"
              ? "bg-blue-400/10 border-blue-400/30"
              : kycStatus === "rejected"
                ? "bg-destructive/10 border-destructive/30"
                : "bg-amber-400/10 border-amber-400/30"
              }`}>
              <AlertCircle size={16} className={`shrink-0 mt-0.5 ${kycStatus === "submitted" || kycStatus === "under_review" ? "text-blue-400"
                : kycStatus === "rejected" ? "text-destructive"
                  : "text-amber-400"
                }`} />
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-semibold text-foreground">
                  {kycStatus === "rejected" ? "❌ KYC Verification Rejected"
                    : kycStatus === "submitted" || kycStatus === "under_review" ? "🔄 KYC Under Review"
                      : "⚠️ Complete Your KYC Verification"}
                </p>
                <p className="font-body text-xs text-muted-foreground mt-0.5">
                  {kycStatus === "rejected"
                    ? "Your documents were rejected. Please resubmit with valid ID to unlock withdrawals."
                    : kycStatus === "submitted" || kycStatus === "under_review"
                      ? "Your documents are being reviewed. We'll notify you once verified (usually within 24h)."
                      : "ID verification is required to withdraw funds and access all platform features."}
                </p>
              </div>
              {(kycStatus === "pending" || kycStatus === "rejected") && (
                <Link
                  to="/kyc"
                  className="shrink-0 px-3 py-1.5 rounded-lg border font-body text-xs font-medium transition-colors border-amber-400/40 text-amber-400 hover:bg-amber-400/10"
                >
                  {kycStatus === "rejected" ? "Resubmit" : "Verify Now"}
                </Link>
              )}
            </div>
          </motion.div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading
            ? [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)
            : statCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-card border border-border rounded-lg p-5 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="font-body text-xs text-muted-foreground">{card.label}</p>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.positive ? "bg-accent-dim" : "bg-destructive/10"}`}>
                    <card.icon size={14} className={card.positive ? "text-primary" : "text-destructive"} />
                  </div>
                </div>
                <p className={`font-mono text-xl font-bold truncate ${card.positive ? "text-foreground" : "text-destructive"}`}>
                  {card.value}
                </p>
                <p className="font-body text-xs text-muted-foreground mt-1">{card.sub}</p>
              </motion.div>
            ))}
        </div>

        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
          <PortfolioChart transactions={transactions} />
        </motion.div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <HoldingsTable investments={investments} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <RecentActivity transactions={transactions} />
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
