import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "react-router-dom";

const mockHoldings = [
  { asset: "Bitcoin", symbol: "BTC", amount: "0.1520", value: "$10,248.24", pnl: "+$1,245.00", pnlPct: "+13.8%", positive: true, color: "hsl(38 90% 50%)" },
  { asset: "Ethereum", symbol: "ETH", amount: "1.8000", value: "$6,339.24", pnl: "+$482.30", pnlPct: "+8.2%", positive: true, color: "hsl(230 60% 55%)" },
  { asset: "Solana", symbol: "SOL", amount: "12.500", value: "$2,230.25", pnl: "+$642.10", pnlPct: "+28.4%", positive: true, color: "hsl(270 80% 60%)" },
  { asset: "Avalanche", symbol: "AVAX", amount: "25.000", value: "$968.75", pnl: "-$82.50", pnlPct: "-7.8%", positive: false, color: "hsl(0 80% 55%)" },
];

interface HoldingsTableProps {
  investments: any[];
}

const HoldingsTable = ({ investments }: HoldingsTableProps) => {
  const holdings = investments.length > 0 ? investments : [];
  const displayData = holdings.length > 0 ? [] : mockHoldings;

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-base text-foreground">Holdings</h3>
        <Link to="/plans" className="font-body text-xs text-primary hover:underline">View Plans →</Link>
      </div>

      {displayData.length === 0 && holdings.length === 0 ? (
        <div className="text-center py-8">
          <p className="font-body text-sm text-muted-foreground mb-2">No holdings yet</p>
          <Link to="/plans" className="font-body text-sm text-primary hover:underline">Browse investment plans →</Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left font-body text-xs text-muted-foreground pb-3">Asset</th>
                <th className="text-right font-body text-xs text-muted-foreground pb-3">Holdings</th>
                <th className="text-right font-body text-xs text-muted-foreground pb-3">Value</th>
                <th className="text-right font-body text-xs text-muted-foreground pb-3">P&L</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((h) => (
                <tr key={h.symbol} className="border-b border-border/30 hover:bg-card-hover transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: h.color, color: "#000" }}>
                        {h.symbol[0]}
                      </div>
                      <div>
                        <p className="font-body text-sm font-medium text-foreground">{h.asset}</p>
                        <p className="font-mono text-xs text-muted-foreground">{h.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-right font-mono text-sm text-foreground">{h.amount}</td>
                  <td className="py-3 text-right font-mono text-sm text-foreground">{h.value}</td>
                  <td className="py-3 text-right">
                    <span className={`font-mono text-sm flex items-center justify-end gap-1 ${h.positive ? "text-primary" : "text-destructive"}`}>
                      {h.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {h.pnl} ({h.pnlPct})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HoldingsTable;
