import { motion } from "framer-motion";
import { ArrowUpRight, TrendingUp, Shield, Zap, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6 } },
};

const InvestmentPlansPreview = () => {
  const { t } = useTranslation();
  const plans = [
    { name: t("plansPreview.starter"), risk: t("plansPreview.conservative"), icon: Shield, returnRange: "8-12%", minInvestment: "$100", duration: "90 days", features: [t("plansPreview.starterF1"), t("plansPreview.starterF2"), t("plansPreview.starterF3")], popular: false },
    { name: t("plansPreview.growth"), risk: t("plansPreview.moderate"), icon: TrendingUp, returnRange: "15-25%", minInvestment: "$1,000", duration: "180 days", features: [t("plansPreview.growthF1"), t("plansPreview.growthF2"), t("plansPreview.growthF3")], popular: true },
    { name: t("plansPreview.accelerator"), risk: t("plansPreview.growthRisk"), icon: Zap, returnRange: "25-40%", minInvestment: "$5,000", duration: "365 days", features: [t("plansPreview.acceleratorF1"), t("plansPreview.acceleratorF2"), t("plansPreview.acceleratorF3")], popular: false },
    { name: t("plansPreview.alpha"), risk: t("plansPreview.aggressive"), icon: Flame, returnRange: "40-80%", minInvestment: "$25,000", duration: "365 days", features: [t("plansPreview.alphaF1"), t("plansPreview.alphaF2"), t("plansPreview.alphaF3")], popular: false },
  ];
  return (
    <section id="plans" className="px-6 lg:px-12 py-24 bg-surface">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="font-mono text-xs text-primary tracking-wider uppercase mb-4 block">{t("plansPreview.label")}</span>
          <h2 className="font-display text-5xl sm:text-6xl text-foreground mb-4">{t("plansPreview.title")}</h2>
          <p className="font-body text-muted-foreground max-w-md mx-auto">
            {t("plansPreview.subtitle")}
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={item}
              whileHover={{ y: -8, transition: { duration: 0.25 } }}
              className={`relative bg-card border rounded-lg p-6 transition-all cursor-pointer ${
                plan.popular ? "border-primary/40 shadow-[0_0_30px_hsl(130_100%_65%/0.08)]" : "border-border hover:border-border-light"
              }`}
            >
              {plan.popular && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                >
                  <span className="font-mono text-[10px] bg-primary text-primary-foreground px-3 py-1 rounded-pill font-bold">
                    {t("plansPreview.mostPopular")}
                  </span>
                </motion.div>
              )}
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center mb-4"
              >
                <plan.icon size={18} className="text-primary" />
              </motion.div>
              <h3 className="font-heading font-bold text-lg text-foreground mb-1">{plan.name}</h3>
              <p className="font-mono text-xs text-muted-foreground mb-4">{plan.risk}</p>
              <p className="font-display text-3xl text-foreground mb-1">{plan.returnRange}</p>
              <p className="font-body text-xs text-muted-foreground mb-4">{t("plansPreview.expectedReturn")}</p>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between font-body text-xs">
                  <span className="text-muted-foreground">{t("plansPreview.minInvestment")}</span>
                  <span className="text-foreground font-medium">{plan.minInvestment}</span>
                </div>
                <div className="flex justify-between font-body text-xs">
                  <span className="text-muted-foreground">{t("plansPreview.duration")}</span>
                  <span className="text-foreground font-medium">{plan.duration}</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="font-body text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <Button variant={plan.popular ? "hero" : "hero-ghost"} className="w-full text-xs" size="sm">
                  {t("common.getStarted")} <ArrowUpRight size={12} />
                </Button>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default InvestmentPlansPreview;
