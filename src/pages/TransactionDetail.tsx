import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, Loader2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/layout/AppLayout";
import { formatDistanceToNow } from "date-fns";

const statusSteps: Record<string, string[]> = {
  deposit: ["Submitted", "Processing", "Confirmed"],
  withdrawal: ["Submitted", "Under Review", "Processing", "Sent"],
  investment: ["Submitted", "Active"],
  return: ["Calculated", "Credited"],
  fee: ["Applied"],
};

const statusIndex: Record<string, number> = {
  pending: 0,
  processing: 1,
  completed: 3,
  failed: -1,
  cancelled: -1,
};

const TransactionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    const fetchTx = async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      if (data) setTransaction(data);
      setLoading(false);
    };
    fetchTx();

    // Realtime updates
    const channel = supabase
      .channel(`tx-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "transactions", filter: `id=eq.${id}` }, (payload) => {
        setTransaction(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!transaction) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 max-w-2xl mx-auto text-center">
          <p className="font-body text-muted-foreground">Transaction not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/transactions")}>Back to Transactions</Button>
        </div>
      </AppLayout>
    );
  }

  const isIncome = transaction.type === "deposit" || transaction.type === "return";
  const steps = statusSteps[transaction.type] || ["Submitted", "Completed"];
  const currentStep = transaction.status === "completed" ? steps.length - 1
    : transaction.status === "processing" ? Math.min(1, steps.length - 1)
    : transaction.status === "failed" || transaction.status === "cancelled" ? -1
    : 0;

  const copyRef = () => {
    navigator.clipboard.writeText(transaction.reference || transaction.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate("/transactions")} className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft size={14} /> Back to Transactions
          </button>

          {/* Header */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isIncome ? "bg-accent-dim" : "bg-destructive/10"}`}>
                {isIncome ? <ArrowDownLeft size={20} className="text-primary" /> : <ArrowUpRight size={20} className="text-destructive" />}
              </div>
              <div>
                <h1 className="font-heading font-bold text-xl text-foreground capitalize">{transaction.type}</h1>
                <p className="font-mono text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className={`font-mono text-2xl font-medium ${isIncome ? "text-primary" : "text-foreground"}`}>
                  {isIncome ? "+" : "-"}${Math.abs(transaction.amount).toLocaleString()}
                </p>
                <p className="font-mono text-xs text-muted-foreground">{transaction.currency}</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {transaction.status === "completed" && <CheckCircle size={14} className="text-primary" />}
              {transaction.status === "pending" && <Clock size={14} className="text-amber-400" />}
              {transaction.status === "processing" && <Loader2 size={14} className="text-blue-400 animate-spin" />}
              {(transaction.status === "failed" || transaction.status === "cancelled") && <XCircle size={14} className="text-destructive" />}
              <span className={`font-mono text-xs px-2 py-0.5 rounded-pill capitalize ${
                transaction.status === "completed" ? "bg-accent-dim text-primary"
                : transaction.status === "pending" ? "bg-amber-400/10 text-amber-400"
                : transaction.status === "processing" ? "bg-blue-400/10 text-blue-400"
                : "bg-destructive/10 text-destructive"
              }`}>
                {transaction.status}
              </span>
            </div>
          </div>

          {/* Progress Tracker */}
          {currentStep >= 0 && (
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h2 className="font-heading font-bold text-sm text-foreground mb-4">Transaction Progress</h2>
              <div className="flex items-center justify-between">
                {steps.map((s, i) => (
                  <div key={s} className="flex items-center flex-1 last:flex-initial">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                        i <= currentStep
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}>
                        {i <= currentStep ? <Check size={14} /> : i + 1}
                      </div>
                      <span className={`font-body text-[10px] mt-2 text-center ${
                        i <= currentStep ? "text-primary" : "text-muted-foreground"
                      }`}>
                        {s}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 mb-5 ${
                        i < currentStep ? "bg-primary" : "bg-border"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-heading font-bold text-sm text-foreground mb-4">Details</h2>
            <div className="space-y-3">
              {[
                { label: "Transaction ID", value: transaction.id.slice(0, 8) + "..." + transaction.id.slice(-8), copyable: true },
                { label: "Type", value: transaction.type },
                { label: "Amount", value: `${transaction.amount.toLocaleString()} ${transaction.currency}` },
                { label: "Status", value: transaction.status },
                { label: "Description", value: transaction.description || "—" },
                { label: "Reference", value: transaction.reference || "—" },
                { label: "TX Hash", value: transaction.tx_hash || "Pending" },
                { label: "Created", value: new Date(transaction.created_at).toLocaleString() },
                { label: "Updated", value: new Date(transaction.updated_at).toLocaleString() },
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-2 border-b border-border/30 last:border-0">
                  <span className="font-body text-sm text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-foreground capitalize">{item.value}</span>
                    {item.copyable && (
                      <button onClick={copyRef} className="text-muted-foreground hover:text-foreground">
                        {copied ? <Check size={12} className="text-primary" /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default TransactionDetail;
