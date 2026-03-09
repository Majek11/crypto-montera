import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";

interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  sparkline_in_7d?: { price: number[] };
}

// IDs in CoinGecko format
const COIN_IDS = [
  "bitcoin", "ethereum", "solana", "binancecoin",
  "ripple", "cardano", "dogecoin", "avalanche-2",
];

const COIN_COLORS: Record<string, string> = {
  bitcoin: "hsl(38 90% 50%)",
  ethereum: "hsl(230 60% 55%)",
  solana: "hsl(270 80% 60%)",
  binancecoin: "hsl(45 100% 50%)",
  ripple: "hsl(200 80% 50%)",
  cardano: "hsl(220 70% 50%)",
  dogecoin: "hsl(38 80% 55%)",
  "avalanche-2": "hsl(0 80% 55%)",
};

async function fetchMarketData(): Promise<CoinMarket[]> {
  const url = new URL("https://api.coingecko.com/api/v3/coins/markets");
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("ids", COIN_IDS.join(","));
  url.searchParams.set("order", "market_cap_desc");
  url.searchParams.set("per_page", "8");
  url.searchParams.set("page", "1");
  url.searchParams.set("sparkline", "true");
  url.searchParams.set("price_change_percentage", "24h");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch market data");
  return res.json();
}

const Sparkline = ({ prices, positive }: { prices: number[]; positive: boolean }) => {
  if (!prices || prices.length === 0) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 100, h = 24;
  const pts = prices
    .map((p, i) => {
      const x = (i / (prices.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block">
      <polyline
        points={pts}
        fill="none"
        stroke={positive ? "hsl(130 100% 65%)" : "hsl(0 84% 60%)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const formatMarketCap = (n: number) => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  return `$${(n / 1e6).toFixed(0)}M`;
};

const MarketPreview = () => {
  const { data: coins, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["market-data"],
    queryFn: fetchMarketData,
    staleTime: 60_000,        // 1 minute fresh
    refetchInterval: 90_000,  // auto-refresh every 90s
    retry: 2,
  });

  return (
    <section className="px-6 lg:px-12 py-16 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-8"
        >
          <div>
            <h2 className="font-heading font-bold text-3xl text-foreground mb-2">Market Overview</h2>
            <p className="font-body text-sm text-muted-foreground">
              {isError
                ? "Showing cached data — live refresh unavailable"
                : "Live prices via CoinGecko"}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className={`p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors ${isFetching ? "animate-spin" : ""}`}
            title="Refresh prices"
          >
            <RefreshCw size={14} />
          </button>
        </motion.div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="font-body text-xs text-muted-foreground font-medium pb-3 pr-4">#</th>
                <th className="font-body text-xs text-muted-foreground font-medium pb-3 pr-4">Asset</th>
                <th className="font-body text-xs text-muted-foreground font-medium pb-3 pr-4 text-right">Price</th>
                <th className="font-body text-xs text-muted-foreground font-medium pb-3 pr-4 text-right">24h</th>
                <th className="font-body text-xs text-muted-foreground font-medium pb-3 pr-4 text-right hidden md:table-cell">7D</th>
                <th className="font-body text-xs text-muted-foreground font-medium pb-3 pr-4 text-right hidden lg:table-cell">Market Cap</th>
                <th className="font-body text-xs text-muted-foreground font-medium pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="py-4 pr-4">
                        <div className="h-4 bg-secondary rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}
              {(coins ?? []).map((coin, i) => {
                const isPositive = coin.price_change_percentage_24h >= 0;
                const color = COIN_COLORS[coin.id] ?? "hsl(0 0% 60%)";
                return (
                  <motion.tr
                    key={coin.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-border/50 hover:bg-card transition-colors group"
                  >
                    <td className="py-4 pr-4 font-mono text-xs text-muted-foreground">{i + 1}</td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: color, color: "#000" }}
                        >
                          {coin.symbol[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-body text-sm font-medium text-foreground">{coin.name}</p>
                          <p className="font-mono text-xs text-muted-foreground uppercase">{coin.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-right font-mono text-sm text-foreground">
                      ${coin.current_price.toLocaleString("en-US", { minimumFractionDigits: coin.current_price < 1 ? 4 : 2 })}
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <span className={`font-mono text-xs px-2 py-0.5 rounded-pill flex items-center justify-end gap-1 w-fit ml-auto ${isPositive ? "bg-accent-dim text-primary" : "bg-destructive/10 text-destructive"}`}>
                        {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-right hidden md:table-cell">
                      <Sparkline
                        prices={coin.sparkline_in_7d?.price ?? []}
                        positive={isPositive}
                      />
                    </td>
                    <td className="py-4 pr-4 text-right font-mono text-sm text-muted-foreground hidden lg:table-cell">
                      {formatMarketCap(coin.market_cap)}
                    </td>
                    <td className="py-4 text-right">
                      <a href="/signup" className="font-body text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Trade →
                      </a>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default MarketPreview;
