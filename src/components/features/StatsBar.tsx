import { motion } from "framer-motion";

const stats = [
  { label: "Market Cap", value: "$2.45T", change: "+3.2%" },
  { label: "24h Volume", value: "$98.7B", change: "+12.5%" },
  { label: "BTC Dominance", value: "52.4%", change: "-0.3%" },
  { label: "Active Traders", value: "2.1M", change: "+8.7%" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } },
};

const StatsBar = () => {
  return (
    <section className="border-y border-border bg-surface px-6 lg:px-12 py-8">
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={item}>
            <p className="font-body text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="font-mono text-2xl lg:text-3xl text-foreground font-medium">{stat.value}</p>
            <span className={`font-mono text-xs ${parseFloat(stat.change) >= 0 ? "text-primary" : "text-destructive"}`}>
              {stat.change}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default StatsBar;
