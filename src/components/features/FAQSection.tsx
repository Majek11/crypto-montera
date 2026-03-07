import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "How does Monetra's zero-fee model work?", a: "We earn revenue through institutional partnerships and premium services, not from your trades. This means every dollar you invest goes directly into your portfolio with zero commissions or hidden fees." },
  { q: "Is my investment secure?", a: "Absolutely. We use bank-grade security including multi-signature wallets, cold storage for 98% of assets, real-time threat monitoring, and SOC 2 Type II certification. Your assets are also insured up to $250M." },
  { q: "What is the minimum investment amount?", a: "You can start investing with as little as $100 on our Starter plan. Our plans range from conservative to aggressive growth strategies, each with different minimum thresholds." },
  { q: "How do managed investment plans work?", a: "Our AI-driven algorithms automatically allocate your investment across a diversified portfolio of digital assets based on your selected risk level. Plans are rebalanced regularly to optimize returns." },
  { q: "Can I withdraw my funds at any time?", a: "Yes, you can withdraw your funds at any time. Withdrawals typically process within 24 hours. Some plans may have a minimum holding period for optimal returns, but there are no lock-up penalties." },
  { q: "Do I need to complete KYC verification?", a: "KYC verification is required for investments above $10,000 or when using fiat on-ramps. For smaller investments using crypto deposits, you can start trading immediately." },
  { q: "What cryptocurrencies does Monetra support?", a: "We support over 500 trading pairs across all major blockchains including Bitcoin, Ethereum, Solana, Polygon, Avalanche, and more. New assets are added regularly." },
  { q: "How are returns calculated?", a: "Returns are calculated based on the performance of your portfolio assets. We provide real-time tracking of your investment value, including unrealized gains/losses and historical performance." },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const FAQSection = () => {
  return (
    <section id="faq" className="px-6 lg:px-12 py-24 bg-surface">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="font-mono text-xs text-primary tracking-wider uppercase mb-4 block">FAQ</span>
          <h2 className="font-display text-5xl sm:text-6xl text-foreground mb-4">FREQUENTLY ASKED QUESTIONS</h2>
          <p className="font-body text-muted-foreground">
            Everything you need to know about investing with Monetra.
          </p>
        </motion.div>

        <Accordion type="single" collapsible className="space-y-3">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="space-y-3"
          >
            {faqs.map((faq, i) => (
              <motion.div key={i} variants={item}>
                <AccordionItem
                  value={`item-${i}`}
                  className="bg-card border border-border rounded-lg px-6 data-[state=open]:border-border-light transition-all"
                >
                  <AccordionTrigger className="font-heading font-bold text-sm text-foreground hover:no-underline py-5">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed pb-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </motion.div>
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
