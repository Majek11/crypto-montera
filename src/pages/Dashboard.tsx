import { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Star, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/layout/AppLayout";
import PortfolioChart from "@/components/dashboard/PortfolioChart";
import HoldingsTable from "@/components/dashboard/HoldingsTable";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { useInvestments } from "@/hooks/useInvestments";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import SEO from "@/components/SEO";

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
  const { data: investments = [], isLoading: invLoading } = useInvestments();
  const { data: transactions = [], isLoading: txLoading } = useTransactions({ limit: 10 });
  const [availableBalance, setAvailableBalance] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("balance").eq("user_id", user.id).single()
      .then(({ data }) => { if (data) setAvailableBalance(Number((data as any).balance) || 0); });
  }, [user]);

  const loading = invLoading || txLoading;

  const stats = useMemo(() => {
    const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
    const totalValue = investments.reduce((s, i) => s + (i.current_value ?? i.amount), 0);
    const pnl = totalValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? ((pnl / totalInvested) * 100).toFixed(2) : "0.00";

    let bestPlanName = "—";
    let bestReturn = -Infinity;
    for (const inv of investments) {
      const ret = inv.total_return ?? 0;
      if (ret > bestReturn) {
        bestReturn = ret;
        bestPlanName = (inv as any).investment_plans?.name ?? "—";
      }
    }

    return { totalInvested, totalValue, pnl, pnlPercent, bestPlanName, bestReturn };
  }, [investments]);

  const statCards = [
    {
      label: t("dashboard.portfolioValue"),
      value: `$${stats.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      sub: t("dashboard.invested", { amount: stats.totalInvested.toLocaleString("en-US", { minimumFractionDigits: 2 }) }),
      icon: TrendingUp,
      positive: true,
    },
    {
      label: t("dashboard.totalPnl"),
      value: `${stats.pnl >= 0 ? "+" : "-"}$${Math.abs(stats.pnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      sub: t("dashboard.allTime", { percent: `${stats.pnl >= 0 ? "+" : ""}${stats.pnlPercent}` }),
      icon: stats.pnl >= 0 ? ArrowUpRight : ArrowDownRight,
      positive: stats.pnl >= 0,
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
