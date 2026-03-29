import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, DollarSign, TrendingUp, ShieldCheck,
  Clock, AlertCircle, ArrowUpRight, ArrowDownLeft,
  CheckCircle, Gift, BarChart3, ChevronRight, RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const AdminOverview = () => {
  const [stats, setStats] = useState({
    users: 0,
    activeInvestments: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingTx: 0,
    kycQueue: 0,
    bonusesTotal: 0,
    totalAUM: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    const [
      profilesRes,
      investmentsRes,
      pendingTxRes,
      kycRes,
      depositsRes,
      withdrawalsRes,
      bonusesRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("investments").select("amount, current_value").eq("status", "active"),
      supabase.from("transactions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("kyc_verifications").select("id", { count: "exact", head: true }).in("status", ["submitted", "under_review"]),
      supabase.from("transactions").select("amount").eq("type", "deposit").eq("status", "completed"),
      supabase.from("transactions").select("amount").eq("type", "withdrawal").eq("status", "completed"),
      supabase.from("transactions").select("amount").ilike("description", "%bonus%").eq("status", "completed"),
    ]);

    const totalAUM = investmentsRes.data?.reduce((s, i) => s + Number(i.current_value ?? i.amount), 0) ?? 0;
    const totalDeposits = depositsRes.data?.reduce((s, t) => s + Number(t.amount), 0) ?? 0;
    const totalWithdrawals = withdrawalsRes.data?.reduce((s, t) => s + Number(t.amount), 0) ?? 0;
    const bonusesTotal = bonusesRes.data?.reduce((s, t) => s + Number(t.amount), 0) ?? 0;

    setStats({
      users: profilesRes.count ?? 0,
      activeInvestments: investmentsRes.data?.length ?? 0,
      totalDeposits,
      totalWithdrawals,
      pendingTx: pendingTxRes.count ?? 0,
      kycQueue: kycRes.count ?? 0,
      bonusesTotal,
      totalAUM,
    });

    const { data: activity } = await supabase
      .from("transactions")
      .select("*, profiles!transactions_user_id_fkey(display_name, email)")
      .order("created_at", { ascending: false })
      .limit(10);
    setRecentActivity(activity ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  const fmt = (v: number, money = false) =>
    money
      ? `$${v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      : v.toLocaleString();

  const statCards = [
    { label: "Total Users", value: stats.users, money: false, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10", link: "/admin/users", urgent: false },
    { label: "Assets Under Mgmt", value: stats.totalAUM, money: true, icon: BarChart3, color: "text-primary", bg: "bg-accent-dim", link: "/admin/investments", urgent: false },
    { label: "Total Deposits In", value: stats.totalDeposits, money: true, icon: ArrowDownLeft, color: "text-primary", bg: "bg-accent-dim", link: "/admin/transactions", urgent: false },
    { label: "Total Withdrawals Out", value: stats.totalWithdrawals, money: true, icon: ArrowUpRight, color: "text-orange-400", bg: "bg-orange-400/10", link: "/admin/transactions", urgent: false },
    { label: "Active Investments", value: stats.activeInvestments, money: false, icon: TrendingUp, color: "text-primary", bg: "bg-accent-dim", link: "/admin/investments", urgent: false },
    { label: "Bonuses Credited", value: stats.bonusesTotal, money: true, icon: Gift, color: "text-amber-400", bg: "bg-amber-400/10", link: "/admin/bonus", urgent: false },
    { label: "Pending Transactions", value: stats.pendingTx, money: false, icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10", link: "/admin/transactions", urgent: stats.pendingTx > 0 },
    { label: "KYC Queue", value: stats.kycQueue, money: false, icon: ShieldCheck, color: "text-destructive", bg: "bg-destructive/10", link: "/admin/kyc", urgent: stats.kycQueue > 0 },
  ];

  const txTypeColor = (type: string) =>
    type === "deposit" || type === "return" ? "text-primary"
      : type === "withdrawal" ? "text-destructive"
        : "text-muted-foreground";

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading font-bold text-3xl text-foreground mb-1">Admin Dashboard</h1>
            <p className="font-body text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            onClick={fetchStats}
            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </motion.div>

        {/* Urgent Alerts */}
        {(stats.pendingTx > 0 || stats.kycQueue > 0) && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 space-y-2">
            {stats.pendingTx > 0 && (
              <Link
                to="/admin/transactions"
                className="flex items-center gap-3 bg-amber-400/10 border border-amber-400/30 rounded-lg px-4 py-3 hover:bg-amber-400/15 transition-colors"
              >
                <AlertCircle size={14} className="text-amber-400 shrink-0" />
                <p className="font-body text-sm text-foreground flex-1">
                  <span className="font-semibold text-amber-400">{stats.pendingTx} transaction{stats.pendingTx !== 1 ? "s" : ""}</span>
                  {" "}awaiting review — click to approve or reject
                </p>
                <ChevronRight size={14} className="text-muted-foreground shrink-0" />
              </Link>
            )}
            {stats.kycQueue > 0 && (
              <Link
                to="/admin/kyc"
                className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 hover:bg-destructive/15 transition-colors"
              >
                <ShieldCheck size={14} className="text-destructive shrink-0" />
                <p className="font-body text-sm text-foreground flex-1">
                  <span className="font-semibold text-destructive">{stats.kycQueue} KYC submission{stats.kycQueue !== 1 ? "s" : ""}</span>
                  {" "}waiting for identity review
                </p>
                <ChevronRight size={14} className="text-muted-foreground shrink-0" />
              </Link>
            )}
          </motion.div>
        )}

        {/* Stat Cards — 4 per row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {statCards.map((card) => (
            <Link
              key={card.label}
              to={card.link}
              className={`bg-card border rounded-xl p-5 hover:border-primary/30 transition-all group ${card.urgent ? "border-amber-400/30" : "border-border"
                }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-body text-xs text-muted-foreground">{card.label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.bg}`}>
                  <card.icon size={14} className={card.color} />
                </div>
              </div>
              {loading ? (
                <div className="h-7 w-24 bg-secondary rounded animate-pulse" />
              ) : (
                <p className={`font-mono text-xl font-bold ${card.urgent ? "text-amber-400" : "text-foreground"}`}>
                  {fmt(card.value, card.money)}
                </p>
              )}
            </Link>
          ))}
        </motion.div>

        {/* Recent Activity Feed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-heading font-bold text-sm text-foreground">Recent Platform Activity</h2>
              <Link to="/admin/transactions" className="font-body text-xs text-primary hover:underline">
                View all →
              </Link>
            </div>

            <div className="divide-y divide-border/40">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                    <div className="w-8 h-8 bg-secondary rounded-lg animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-36 bg-secondary rounded animate-pulse" />
                      <div className="h-2.5 w-24 bg-secondary rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-16 bg-secondary rounded animate-pulse" />
                  </div>
                ))
              ) : recentActivity.length === 0 ? (
                <p className="font-body text-sm text-muted-foreground text-center py-10">No activity yet</p>
              ) : (
                recentActivity.map((tx) => {
                  const isIncome = tx.type === "deposit" || tx.type === "return";
                  const profile = tx.profiles as any;
                  return (
                    <div key={tx.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-card-hover transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isIncome ? "bg-accent-dim" : "bg-destructive/10"}`}>
                        {isIncome
                          ? <ArrowDownLeft size={13} className="text-primary" />
                          : <ArrowUpRight size={13} className="text-destructive" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm text-foreground truncate">
                          {profile?.display_name || profile?.email || "Unknown User"}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground capitalize">
                          {tx.type} · {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-mono text-sm font-medium ${txTypeColor(tx.type)}`}>
                          {isIncome ? "+" : "-"}${Math.abs(Number(tx.amount)).toLocaleString()}
                        </p>
                        {tx.status === "pending" && (
                          <span className="font-mono text-[10px] bg-amber-400/10 text-amber-400 px-1.5 py-0.5 rounded-pill">
                            Needs Review
                          </span>
                        )}
                        {tx.status === "completed" && (
                          <CheckCircle size={12} className="text-primary ml-auto mt-0.5" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;
