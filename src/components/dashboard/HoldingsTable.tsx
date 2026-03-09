import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Investment } from "@/types";

interface HoldingsTableProps {
  investments: Investment[];
}

const planColors = [
  "hsl(130 100% 65%)",
  "hsl(230 60% 55%)",
  "hsl(270 80% 60%)",
  "hsl(38 90% 50%)",
  "hsl(0 80% 55%)",
  "hsl(180 60% 50%)",
];

const HoldingsTable = ({ investments }: HoldingsTableProps) => {
  const { t } = useTranslation();

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-base text-foreground">{t("holdings.title")}</h3>
        <Link to="/plans" className="font-body text-xs text-primary hover:underline">{t("holdings.viewPlans")}</Link>
      </div>

      {investments.length === 0 ? (
        <div className="text-center py-8">
          <p className="font-body text-sm text-muted-foreground mb-2">{t("holdings.noHoldings")}</p>
          <Link to="/plans" className="font-body text-sm text-primary hover:underline">{t("holdings.browsePlans")}</Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left font-body text-xs text-muted-foreground pb-3">{t("holdings.asset")}</th>
                <th className="text-right font-body text-xs text-muted-foreground pb-3">{t("holdings.currentValue")}</th>
                <th className="text-right font-body text-xs text-muted-foreground pb-3">{t("holdings.value")}</th>
                <th className="text-right font-body text-xs text-muted-foreground pb-3">{t("holdings.pnl")}</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((inv, idx) => {
                const planName = (inv as any).investment_plans?.name ?? "Investment";
                const currentValue = inv.current_value ?? inv.amount;
                const pnl = currentValue - inv.amount;
                const pnlPct = inv.amount > 0 ? ((pnl / inv.amount) * 100).toFixed(1) : "0.0";
                const positive = pnl >= 0;
                const color = planColors[idx % planColors.length];

                return (
                  <tr key={inv.id} className="border-b border-border/30 hover:bg-card-hover transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: color, color: "#000" }}>
                          {planName[0]}
                        </div>
                        <div>
                          <p className="font-body text-sm font-medium text-foreground">{planName}</p>
                          <p className="font-mono text-xs text-muted-foreground capitalize">{inv.status}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono text-sm text-foreground">
                      ${inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-right font-mono text-sm text-foreground">
                      ${currentValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`font-mono text-sm flex items-center justify-end gap-1 ${positive ? "text-primary" : "text-destructive"}`}>
                        {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {positive ? "+" : "-"}${Math.abs(pnl).toLocaleString("en-US", { minimumFractionDigits: 2 })} ({positive ? "+" : ""}{pnlPct}%)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HoldingsTable;
