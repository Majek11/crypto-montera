import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Star, Wallet } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PortfolioChart from "@/components/dashboard/PortfolioChart";
import HoldingsTable from "@/components/dashboard/HoldingsTable";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { useInvestments } from "@/hooks/useInvestments";
import { useTransactions } from "@/hooks/useTransactions";
import { useWallets } from "@/hooks/useWallets";
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
  const { data: investments = [], isLoading: invLoading } = useInvestments();
  const { data: transactions = [], isLoading: txLoading } = useTransactions({ limit: 10 });
  const { data: wallets = [], isLoading: walletLoading } = useWallets();

  const loading = invLoading || txLoading || walletLoading;

  const stats = useMemo(() => {
    const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
    const totalValue = investments.reduce((s, i) => s + (i.current_value ?? i.amount), 0);
    const pnl = totalValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? ((pnl / totalInvested) * 100).toFixed(2) : "0.00";
    const walletBalance = wallets.reduce((s, w) => s + w.balance, 0);

    let bestPlanName = "—";
    let bestReturn = -Infinity;
    for (const inv of investments) {
      const ret = inv.total_return ?? 0;
      if (ret > bestReturn) {
        bestReturn = ret;
        bestPlanName = (inv as any).investment_plans?.name ?? "—";
      }
    }

    return { totalInvested, totalValue, pnl, pnlPercent, walletBalance, bestPlanName, bestReturn };
  }, [investments, wallets]);

  const statCards = [
    {
      label: "Portfolio Value",
      value: `$${stats.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      sub: `Invested: $${stats.totalInvested.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      positive: true,
    },
    {
      label: "Total P&L",
      value: `${stats.pnl >= 0 ? "+" : "-"}$${Math.abs(stats.pnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      sub: `${stats.pnl >= 0 ? "+" : ""}${stats.pnlPercent}% all time`,
      icon: stats.pnl >= 0 ? ArrowUpRight : ArrowDownRight,
      positive: stats.pnl >= 0,
    },
    {
      label: "Wallet Balance",
      value: `$${stats.walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      sub: `${wallets.length} wallet${wallets.length !== 1 ? "s" : ""} connected`,
      icon: Wallet,
      positive: true,
    },
    {
      label: "Best Performer",
      value: stats.bestPlanName,
      sub: stats.bestReturn > 0
        ? `+$${stats.bestReturn.toLocaleString("en-US", { minimumFractionDigits: 2 })} return`
        : "No returns yet",
      icon: Star,
      positive: true,
    },
  ];

  return (
    <AppLayout>
      <SEO title="Dashboard" description="Your live crypto portfolio — balance, investments, recent transactions, and performance chart." noIndex />
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-heading font-bold text-3xl text-foreground mb-1">Dashboard</h1>
          <p className="font-body text-sm text-muted-foreground">Your portfolio at a glance</p>
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
