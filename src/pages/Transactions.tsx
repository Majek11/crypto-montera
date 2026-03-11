import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Search, Eye, SlidersHorizontal, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { toast } from "sonner";
import type { Transaction } from "@/types";
import SEO from "@/components/SEO";

const typeFilters = ["All", "Deposit", "Withdrawal", "Investment", "Return", "Fee"];
const statusFilters = ["All", "Pending", "Processing", "Completed", "Failed", "Cancelled"];

const statusColors: Record<string, string> = {
  completed: "bg-accent-dim text-primary",
  pending: "bg-amber-400/10 text-amber-400",
  processing: "bg-blue-400/10 text-blue-400",
  failed: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

const Transactions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchTx = async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) toast.error("Failed to load transactions");
      else if (data) setTransactions(data);
      setLoading(false);
    };
    fetchTx();
  }, [user]);

  const activeFilterCount = [
    typeFilter !== "All",
    statusFilter !== "All",
    !!dateFrom,
    !!dateTo,
    !!search,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setTypeFilter("All");
    setStatusFilter("All");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  };

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesType = typeFilter === "All" || tx.type === typeFilter.toLowerCase();
      const matchesStatus = statusFilter === "All" || tx.status === statusFilter.toLowerCase();
      const matchesSearch = !search ||
        tx.description?.toLowerCase().includes(search.toLowerCase()) ||
        tx.currency?.toLowerCase().includes(search.toLowerCase()) ||
        tx.reference?.toLowerCase().includes(search.toLowerCase());
      const txDate = new Date(tx.created_at);
      const matchesFrom = !dateFrom || txDate >= new Date(dateFrom);
      const matchesTo = !dateTo || txDate <= new Date(dateTo + "T23:59:59");
      return matchesType && matchesStatus && matchesSearch && matchesFrom && matchesTo;
    });
  }, [transactions, typeFilter, statusFilter, search, dateFrom, dateTo]);

  // Summary stats
  const totalDeposited = transactions.filter(t => t.type === "deposit" && t.status === "completed").reduce((s, t) => s + Number(t.amount), 0);
  const totalWithdrawn = transactions.filter(t => t.type === "withdrawal" && t.status === "completed").reduce((s, t) => s + Number(t.amount), 0);
  const pendingCount = transactions.filter(t => t.status === "pending").length;

  return (
    <AppLayout>
      <SEO title="Transactions" description="View all your crypto deposit, withdrawal, and investment transactions with full history and status tracking." noIndex />
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="font-heading font-bold text-3xl text-foreground mb-1">Transactions</h1>
            <p className="font-body text-sm text-muted-foreground">Your complete transaction history</p>
          </div>
          <div className="flex gap-2">
            <Button variant="hero" size="sm" className="gap-2" onClick={() => navigate("/deposit")}>
              <ArrowDownLeft size={14} /> Deposit
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/withdraw")}>
              <ArrowUpRight size={14} /> Withdraw
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        {!loading && transactions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total Deposited", value: `$${totalDeposited.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "text-primary" },
              { label: "Total Withdrawn", value: `$${totalWithdrawn.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "text-foreground" },
              { label: "Pending", value: pendingCount.toString(), color: "text-amber-400" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
                <p className="font-body text-xs text-muted-foreground mb-1">{stat.label}</p>
                <p className={`font-mono text-lg font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Search + Filter Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3 mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by description, currency..."
                className="pl-9 bg-input border-border text-foreground"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-body transition-all ${showFilters ? "border-primary bg-accent-dim text-primary" : "border-border bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 bg-primary text-primary-foreground text-[10px] font-mono font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border bg-secondary text-muted-foreground hover:text-foreground text-sm font-body transition-colors">
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-card border border-border rounded-lg p-4 space-y-4">
              {/* Type Filter */}
              <div>
                <p className="font-body text-xs text-muted-foreground mb-2">Transaction Type</p>
                <div className="flex gap-1 flex-wrap">
                  {typeFilters.map((f) => (
                    <button
                      key={f}
                      onClick={() => setTypeFilter(f)}
                      className={`px-3 py-1.5 rounded-pill text-xs font-body font-medium transition-all ${typeFilter === f ? "bg-accent-dim text-primary" : "text-muted-foreground hover:text-foreground bg-secondary"}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <p className="font-body text-xs text-muted-foreground mb-2">Status</p>
                <div className="flex gap-1 flex-wrap">
                  {statusFilters.map((f) => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-3 py-1.5 rounded-pill text-xs font-body font-medium transition-all ${statusFilter === f ? "bg-accent-dim text-primary" : "text-muted-foreground hover:text-foreground bg-secondary"}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="font-body text-xs text-muted-foreground mb-1.5">From Date</p>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full h-9 px-3 rounded-md bg-input border border-border text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground mb-1.5">To Date</p>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full h-9 px-3 rounded-md bg-input border border-border text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-secondary rounded animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-body text-sm text-muted-foreground mb-4">
                {transactions.length === 0
                  ? "No transactions yet. Make your first deposit to get started."
                  : "No transactions match your filters."}
              </p>
              {transactions.length === 0 ? (
                <Button variant="hero" onClick={() => navigate("/deposit")}>Make a Deposit</Button>
              ) : (
                <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              )}
            </div>
          ) : (
            <>
              <div className="px-4 py-2 border-b border-border/30 bg-secondary/30">
                <p className="font-body text-xs text-muted-foreground">
                  Showing <span className="text-foreground font-medium">{filtered.length}</span> of {transactions.length} transactions
                </p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-body text-xs text-muted-foreground p-4">Type</th>
                    <th className="text-left font-body text-xs text-muted-foreground p-4 hidden sm:table-cell">Description</th>
                    <th className="text-right font-body text-xs text-muted-foreground p-4">Amount</th>
                    <th className="text-right font-body text-xs text-muted-foreground p-4 hidden md:table-cell">Date</th>
                    <th className="text-right font-body text-xs text-muted-foreground p-4">Status</th>
                    <th className="text-right font-body text-xs text-muted-foreground p-4 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx) => {
                    const isIncome = tx.type === "deposit" || tx.type === "return";
                    return (
                      <tr
                        key={tx.id}
                        className="border-b border-border/30 hover:bg-card-hover transition-colors cursor-pointer"
                        onClick={() => navigate(`/transactions/${tx.id}`)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isIncome ? "bg-accent-dim" : "bg-destructive/10"}`}>
                              {isIncome
                                ? <ArrowDownLeft size={14} className="text-primary" />
                                : <ArrowUpRight size={14} className="text-destructive" />}
                            </div>
                            <span className="font-body text-sm text-foreground capitalize">{tx.type}</span>
                          </div>
                        </td>
                        <td className="p-4 font-body text-sm text-muted-foreground hidden sm:table-cell max-w-xs truncate">
                          {tx.description || "—"}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`font-mono text-sm ${isIncome ? "text-primary" : "text-foreground"}`}>
                            {isIncome ? "+" : "-"}${Math.abs(Number(tx.amount)).toLocaleString()}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground ml-1">{tx.currency}</span>
                        </td>
                        <td className="p-4 text-right font-mono text-xs text-muted-foreground hidden md:table-cell">
                          {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`font-mono text-xs px-2 py-0.5 rounded-pill capitalize ${statusColors[tx.status] || statusColors.pending}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Eye size={14} className="text-muted-foreground" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Transactions;
