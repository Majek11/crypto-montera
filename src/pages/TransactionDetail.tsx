import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, Loader2, Copy, Check, Download } from "lucide-react";
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

  const downloadReceipt = () => {
    const isInc = transaction.type === "deposit" || transaction.type === "return";
    const amountStr = `${isInc ? "+" : "-"}$${Math.abs(transaction.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} ${transaction.currency}`;
    const date = new Date(transaction.created_at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "medium" });
    const statusColor = transaction.status === "completed" ? "#22c55e" : transaction.status === "pending" ? "#f59e0b" : transaction.status === "processing" ? "#60a5fa" : "#ef4444";

    const rows = [
      ["Transaction ID", transaction.id],
      ["Type", transaction.type.toUpperCase()],
      ["Amount", amountStr],
      ["Currency", transaction.currency],
      ["Status", transaction.status.toUpperCase()],
      ["Description", transaction.description || "—"],
      ["Reference", transaction.reference || "—"],
      ["TX Hash", transaction.tx_hash || "Pending"],
      ["Network", transaction.network || "—"],
      ["Date & Time", date],
    ].map(([label, val]) => `
      <tr>
        <td style="padding:10px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6;width:38%">${label}</td>
        <td style="padding:10px 16px;font-size:13px;border-bottom:1px solid #f3f4f6;word-break:break-all;color:#111">${val}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt — ${transaction.id.slice(0, 8)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',sans-serif;background:#f9fafb;display:flex;align-items:flex-start;justify-content:center;min-height:100vh;padding:32px 16px}
    .card{background:#fff;border-radius:16px;max-width:520px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,.08);overflow:hidden}
    .header{background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:32px;text-align:center}
    .logo{font-size:26px;font-weight:700;color:#fff;letter-spacing:-0.5px;margin-bottom:4px}
    .logo span{color:#4ade80}
    .subtitle{font-size:12px;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase}
    .amount-section{padding:28px 32px 20px;text-align:center;border-bottom:1px solid #f3f4f6}
    .amount{font-size:40px;font-weight:700;color:${isInc ? "#16a34a" : "#111"}}
    .amount-label{font-size:12px;color:#6b7280;margin-top:4px}
    .status-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;background:${statusColor}20;color:${statusColor};margin-top:10px;text-transform:uppercase;letter-spacing:.5px}
    table{width:100%;border-collapse:collapse}
    .footer{padding:20px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center}
    .footer p{font-size:11px;color:#9ca3af;line-height:1.6}
    .print-btn{display:block;margin:24px auto 0;padding:10px 28px;background:#16a34a;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}
    @media print{.print-btn{display:none}body{background:#fff;padding:0}.card{box-shadow:none;border-radius:0;max-width:100%}}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">Monte<span>ra</span></div>
      <div class="subtitle">Official Transaction Receipt</div>
    </div>
    <div class="amount-section">
      <div class="amount">${amountStr}</div>
      <div class="amount-label">${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} Transaction</div>
      <div class="status-badge">${transaction.status}</div>
    </div>
    <table>${rows}</table>
    <div class="footer">
      <p>This is an official receipt issued by Montera Crypto Investment Platform.<br>
      Please retain this document for your records. For support, contact <strong>support@monteracrypto.com</strong></p>
      <button class="print-btn" onclick="window.print()">⬇ Save as PDF / Print</button>
    </div>
  </div>
</body>
</html>`;

    const win = window.open("", "_blank", "width=620,height=820");
    if (!win) { toast.error("Pop-up blocked — please allow pop-ups for this site"); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
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

            {/* Status Badge + Download button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {transaction.status === "completed" && <CheckCircle size={14} className="text-primary" />}
                {transaction.status === "pending" && <Clock size={14} className="text-amber-400" />}
                {transaction.status === "processing" && <Loader2 size={14} className="text-blue-400 animate-spin" />}
                {(transaction.status === "failed" || transaction.status === "cancelled") && <XCircle size={14} className="text-destructive" />}
                <span className={`font-mono text-xs px-2 py-0.5 rounded-pill capitalize ${transaction.status === "completed" ? "bg-accent-dim text-primary"
                    : transaction.status === "pending" ? "bg-amber-400/10 text-amber-400"
                      : transaction.status === "processing" ? "bg-blue-400/10 text-blue-400"
                        : "bg-destructive/10 text-destructive"
                  }`}>
                  {transaction.status}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadReceipt}
                className="gap-2 text-xs h-8"
              >
                <Download size={13} /> Download Receipt
              </Button>
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
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${i <= currentStep
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                        }`}>
                        {i <= currentStep ? <Check size={14} /> : i + 1}
                      </div>
                      <span className={`font-body text-[10px] mt-2 text-center ${i <= currentStep ? "text-primary" : "text-muted-foreground"
                        }`}>
                        {s}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 mb-5 ${i < currentStep ? "bg-primary" : "bg-border"
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
