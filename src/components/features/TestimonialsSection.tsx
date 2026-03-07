import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  { name: "Sarah Chen", role: "Portfolio Manager", text: "Monetra transformed how I manage crypto investments. The zero-fee model alone saved us over $50K in the first quarter.", avatar: "SC" },
  { name: "James Rodriguez", role: "Day Trader", text: "The instant settlement is a game-changer. No more waiting for transactions to clear — everything happens in real-time.", avatar: "JR" },
  { name: "Emily Watson", role: "Hedge Fund Director", text: "Bank-grade security with the flexibility of DeFi. Monetra is the only platform I trust with institutional-level investments.", avatar: "EW" },
  { name: "Michael Okafor", role: "Retail Investor", text: "I started with just $500 and the managed plans made it incredibly easy. My portfolio has grown 340% in 8 months.", avatar: "MO" },
  { name: "Lisa Park", role: "Blockchain Developer", text: "The analytics tools are phenomenal. Professional-grade charts and insights that rival platforms costing 10x more.", avatar: "LP" },
  { name: "David Müller", role: "Family Office Manager", text: "Our family office moved $12M to Monetra. The compliance tools and audit trails give us complete peace of mind.", avatar: "DM" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } },
};

const TestimonialsSection = () => {
  return (
    <section className="px-6 lg:px-12 py-24 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="font-mono text-xs text-primary tracking-wider uppercase mb-4 block">Testimonials</span>
          <h2 className="font-display text-5xl sm:text-6xl text-foreground mb-4">WHAT OUR INVESTORS SAY</h2>
          <p className="font-body text-muted-foreground max-w-md mx-auto">
            Join thousands of satisfied investors who chose Monetra.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={item}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="bg-card border border-border rounded-lg p-6 hover:border-border-light transition-all cursor-pointer"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={14} className="text-primary fill-primary" />
                ))}
              </div>
              <p className="font-body text-sm text-muted-foreground leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent-dim flex items-center justify-center">
                  <span className="text-primary text-xs font-bold">{t.avatar}</span>
                </div>
                <div>
                  <p className="font-heading font-bold text-sm text-foreground">{t.name}</p>
                  <p className="font-body text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
