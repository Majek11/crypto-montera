import { motion } from "framer-motion";

const companies = [
  "Coinbase", "Binance", "Kraken", "Chainlink", "Polygon",
  "Aave", "Uniswap", "MakerDAO", "Compound", "Arbitrum",
];

const TrustedCompanies = () => {
  return (
    <section className="px-6 lg:px-12 py-16 bg-surface border-y border-border overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-body text-xs text-muted-foreground text-center mb-8 tracking-wider uppercase"
        >
          Trusted by leading companies worldwide
        </motion.p>

        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-surface to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-surface to-transparent z-10" />

          <div className="flex animate-ticker whitespace-nowrap">
            {[...companies, ...companies].map((company, i) => (
              <div key={i} className="inline-flex items-center justify-center mx-8 min-w-[140px]">
                <div className="flex items-center gap-2 px-6 py-3 rounded-pill border border-border bg-card">
                  <div className="w-6 h-6 rounded-full bg-accent-dim flex items-center justify-center">
                    <span className="text-primary text-xs font-bold">{company[0]}</span>
                  </div>
                  <span className="font-heading font-bold text-sm text-muted-foreground">{company}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedCompanies;
