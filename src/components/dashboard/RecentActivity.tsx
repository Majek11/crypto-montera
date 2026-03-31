import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Transaction } from "@/types";

interface RecentActivityProps {
  transactions: Transaction[];
}

const RecentActivity = ({ transactions }: RecentActivityProps) => {
  const { t } = useTranslation();

  const typeLabels: Record<string, string> = {
    deposit: t("activity.deposit"),
    admin_deposit: t("activity.deposit"),
    profit: "Profit",
    withdrawal: t("activity.withdrawal"),
    investment: t("activity.investment"),
    return: t("activity.return"),
    refund: "Refund",
    fee: t("activity.fee"),
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-base text-foreground">{t("activity.title")}</h3>
        <Link to="/transactions" className="font-body text-xs text-primary hover:underline">{t("common.viewAll")}</Link>
      </div>

      {transactions.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground text-center py-8">{t("activity.noTransactions")}</p>
      ) : (
        <div className="space-y-3">
          {transactions.slice(0, 5).map((tx) => {
            const isIncome = tx.type === "deposit" || tx.type === "admin_deposit" || tx.type === "profit" || tx.type === "return" || tx.type === "refund";
            const amount = Number(tx.amount);
            const formattedAmount = `${isIncome ? "+" : "-"}$${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
            const formattedDate = new Date(tx.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

            return (
              <Link to={`/transactions/${tx.id}`} key={tx.id} className="flex items-center gap-3 py-2 hover:bg-secondary/50 rounded-lg px-2 -mx-2 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isIncome ? "bg-accent-dim" : "bg-destructive/10"}`}>
                  {isIncome ? (
                    <ArrowDownLeft size={14} className="text-primary" />
                  ) : (
                    <ArrowUpRight size={14} className="text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-foreground">{typeLabels[tx.type] || tx.type}</p>
                  <p className="font-mono text-xs text-muted-foreground">{tx.currency || "USD"}</p>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-sm ${isIncome ? "text-primary" : "text-foreground"}`}>{formattedAmount}</p>
                  <p className="font-mono text-xs text-muted-foreground">{formattedDate}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
