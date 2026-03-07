import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Link } from "react-router-dom";

const mockActivity = [
  { type: "deposit", asset: "USDT", amount: "+$5,000.00", date: "Mar 6, 2026", status: "completed" },
  { type: "investment", asset: "Growth Engine", amount: "-$3,000.00", date: "Mar 5, 2026", status: "completed" },
  { type: "return", asset: "Stable Shield", amount: "+$42.50", date: "Mar 4, 2026", status: "completed" },
  { type: "deposit", asset: "BTC", amount: "+$2,500.00", date: "Mar 3, 2026", status: "completed" },
  { type: "withdrawal", asset: "ETH", amount: "-$800.00", date: "Mar 2, 2026", status: "pending" },
];

interface RecentActivityProps {
  transactions: any[];
}

const RecentActivity = ({ transactions }: RecentActivityProps) => {
  const data = transactions.length > 0 ? transactions : [];
  const displayData = data.length > 0 ? [] : mockActivity;

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-base text-foreground">Recent Activity</h3>
        <Link to="/transactions" className="font-body text-xs text-primary hover:underline">View All →</Link>
      </div>

      {displayData.length === 0 && data.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground text-center py-8">No transactions yet</p>
      ) : (
        <div className="space-y-3">
          {displayData.map((tx, i) => {
            const isIncome = tx.type === "deposit" || tx.type === "return";
            return (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isIncome ? "bg-accent-dim" : "bg-destructive/10"}`}>
                  {isIncome ? (
                    <ArrowDownLeft size={14} className="text-primary" />
                  ) : (
                    <ArrowUpRight size={14} className="text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-foreground capitalize">{tx.type}</p>
                  <p className="font-mono text-xs text-muted-foreground">{tx.asset}</p>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-sm ${isIncome ? "text-primary" : "text-foreground"}`}>{tx.amount}</p>
                  <p className="font-mono text-xs text-muted-foreground">{tx.date}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
