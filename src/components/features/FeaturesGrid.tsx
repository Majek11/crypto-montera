import { motion } from "framer-motion";
import { Zap, Shield, BarChart3, Globe } from "lucide-react";

const features = [
  { icon: Zap, title: "Zero Fees", desc: "Trade without commissions. Every dollar you invest goes directly into your portfolio." },
  { icon: Shield, title: "Bank-Grade Security", desc: "Multi-sig wallets, cold storage, and real-time threat monitoring protect your assets." },
  { icon: BarChart3, title: "Advanced Analytics", desc: "Professional-grade charts, indicators, and portfolio insights at your fingertips." },
  { icon: Globe, title: "500+ Trading Pairs", desc: "Access the widest selection of crypto assets across all major blockchains." },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: { 
    opacity: 1, y: 0, scale: 1, 
    transition: { duration: 0.6 } 
  },
};

const FeaturesGrid = () => {
  return (
    <section className="px-6 lg:px-12 py-20 bg-surface">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-heading font-bold text-3xl text-foreground mb-3">Why Monetra?</h2>
          <p className="font-body text-sm text-muted-foreground max-w-md mx-auto">
            Built from the ground up for serious investors who demand performance.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="bg-card border border-border rounded-lg p-6 hover:border-border-light hover:bg-card-hover transition-all group cursor-pointer"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center mb-4 group-hover:shadow-[0_0_20px_hsl(130_100%_65%/0.15)] transition-shadow"
              >
                <f.icon size={18} className="text-primary" />
              </motion.div>
              <h3 className="font-heading font-bold text-base text-foreground mb-2">{f.title}</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
