import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { Transaction } from "@/types";

interface PortfolioChartProps {
  transactions: Transaction[];
}

const timeframes = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "1Y", days: 365 },
];

/**
 * Derives a cumulative portfolio balance chart from real transaction data.
 * For each day in the timeframe, sums deposits/returns (income) and
 * subtracts withdrawals/investments (outflow) to plot a running balance.
 */
function buildChartData(transactions: Transaction[], days: number) {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);

  // Build a map of date-string → net delta for that day
  const deltaByDay = new Map<string, number>();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    deltaByDay.set(key, 0);
  }

  for (const tx of transactions) {
    const txDate = new Date(tx.created_at);
    if (txDate < cutoff) continue;
    const key = txDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!deltaByDay.has(key)) continue;
    const amount = Number(tx.amount);
    const isIncome = tx.type === "deposit" || tx.type === "return";
    deltaByDay.set(key, (deltaByDay.get(key) ?? 0) + (isIncome ? amount : -amount));
  }

  // Convert to running cumulative total
  let running = 0;
  return Array.from(deltaByDay.entries()).map(([date, delta]) => {
    running += delta;
    return { date, value: Math.max(running, 0) };
  });
}

const PortfolioChart = ({ transactions }: PortfolioChartProps) => {
  const [active, setActive] = useState(1); // default 1M
  const data = useMemo(
    () => buildChartData(transactions, timeframes[active].days),
    [transactions, active]
  );

  const hasData = data.some((d) => d.value > 0);
  const maxVal = Math.max(...data.map((d) => d.value));
  const minVal = Math.min(...data.map((d) => d.value));
  const isGrowing = data[data.length - 1]?.value >= (data[0]?.value ?? 0);

  const strokeColor = isGrowing ? "hsl(130, 100%, 65%)" : "hsl(0, 84%, 60%)";
  const gradientId = isGrowing ? "portfolioGainGradient" : "portfolioLossGradient";

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-bold text-base text-foreground">Portfolio Performance</h3>
          {hasData && (
            <p className="font-mono text-xs text-muted-foreground mt-0.5">
              Cumulative balance based on your transactions
            </p>
          )}
        </div>
        <div className="flex gap-1 bg-secondary rounded-pill p-0.5">
          {timeframes.map((tf, i) => (
            <button
              key={tf.label}
              onClick={() => setActive(i)}
              className={`px-3 py-1 rounded-pill text-xs font-mono transition-all ${i === active ? "bg-accent-dim text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-[280px] text-center">
          <p className="font-body text-sm text-muted-foreground">No transaction data for this period.</p>
          <p className="font-body text-xs text-muted-foreground/60 mt-1">
            Make your first deposit to see your portfolio growth here.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(0, 0%, 53%)", fontFamily: "JetBrains Mono" }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(0, 0%, 53%)", fontFamily: "JetBrains Mono" }}
              tickFormatter={(v) =>
                v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`
              }
              width={55}
              domain={[minVal * 0.95, maxVal * 1.05]}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(0, 0%, 6.7%)",
                border: "1px solid hsl(0, 0%, 10%)",
                borderRadius: "8px",
                fontFamily: "JetBrains Mono",
                fontSize: "12px",
                color: "#fff",
              }}
              formatter={(value: number) => [`$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, "Balance"]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default PortfolioChart;
