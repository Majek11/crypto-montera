import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Search, Eye } from "lucide-react";
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

const Transactions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

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

  const filtered = transactions.filter((tx) => {
    const matchesFilter = filter === "All" || tx.type === filter.toLowerCase();
    const matchesSearch = !search || tx.description?.toLowerCase().includes(search.toLowerCase()) || tx.currency?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <AppLayout>
      <SEO title="Transactions" description="View all your crypto deposit, withdrawal, and investment transactions with full history and status tracking." noIndex />
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
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

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className="pl-9 bg-input border-border text-foreground"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {typeFilters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-pill text-xs font-body font-medium transition-all ${filter === f ? "bg-accent-dim text-primary" : "text-muted-foreground hover:text-foreground bg-secondary"
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
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
                {transactions.length === 0 ? "No transactions yet. Make your first deposit to get started." : "No transactions match your filters."}
              </p>
              {transactions.length === 0 && (
                <Button variant="hero" onClick={() => navigate("/deposit")}>Make a Deposit</Button>
              )}
            </div>
          ) : (
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
                    <tr key={tx.id} className="border-b border-border/30 hover:bg-card-hover transition-colors cursor-pointer" onClick={() => navigate(`/transactions/${tx.id}`)}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isIncome ? "bg-accent-dim" : "bg-destructive/10"}`}>
                            {isIncome ? <ArrowDownLeft size={14} className="text-primary" /> : <ArrowUpRight size={14} className="text-destructive" />}
                          </div>
                          <span className="font-body text-sm text-foreground capitalize">{tx.type}</span>
                        </div>
                      </td>
                      <td className="p-4 font-body text-sm text-muted-foreground hidden sm:table-cell">{tx.description || "—"}</td>
                      <td className="p-4 text-right">
                        <span className={`font-mono text-sm ${isIncome ? "text-primary" : "text-foreground"}`}>
                          {isIncome ? "+" : "-"}${Math.abs(tx.amount).toLocaleString()}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground ml-1">{tx.currency}</span>
                      </td>
                      <td className="p-4 text-right font-mono text-xs text-muted-foreground hidden md:table-cell">
                        {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-mono text-xs px-2 py-0.5 rounded-pill capitalize ${tx.status === "completed" ? "bg-accent-dim text-primary"
                          : tx.status === "pending" ? "bg-amber-400/10 text-amber-400"
                            : tx.status === "processing" ? "bg-blue-400/10 text-blue-400"
                              : "bg-destructive/10 text-destructive"
                          }`}>
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
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Transactions;
