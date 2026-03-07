const tickerData = [
  { symbol: "BTC", price: "67,420.50", change: "+2.40" },
  { symbol: "ETH", price: "3,521.80", change: "+1.85" },
  { symbol: "SOL", price: "178.42", change: "+5.12" },
  { symbol: "BNB", price: "612.30", change: "-0.45" },
  { symbol: "XRP", price: "0.6234", change: "+3.21" },
  { symbol: "ADA", price: "0.4521", change: "-1.20" },
  { symbol: "DOGE", price: "0.1542", change: "+8.30" },
  { symbol: "AVAX", price: "38.75", change: "+2.10" },
  { symbol: "DOT", price: "7.42", change: "-0.85" },
  { symbol: "MATIC", price: "0.8912", change: "+1.55" },
];

const TickerBar = () => {
  const items = [...tickerData, ...tickerData];

  return (
    <div className="w-full bg-surface border-b border-border overflow-hidden">
      <div className="animate-ticker flex whitespace-nowrap py-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-6 font-mono text-xs">
            <span className="text-muted-foreground">{item.symbol}/USDT</span>
            <span className="text-foreground">${item.price}</span>
            <span className={parseFloat(item.change) >= 0 ? "text-primary" : "text-destructive"}>
              {parseFloat(item.change) >= 0 ? "▲" : "▼"}{item.change}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TickerBar;
