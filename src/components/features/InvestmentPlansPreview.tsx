import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, TrendingUp, Shield, Zap, Rocket, Star, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { ENTERPRISE_THRESHOLD, ENTERPRISE_EMAIL } from "@/lib/constants";

// ─── Animation variants ────────────────────────────────────────────────────────

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6 } },
};

// ─── Icon / colour maps ────────────────────────────────────────────────────────

const riskIcons: Record<string, any> = {
  conservative: Shield,
  moderate: TrendingUp,
  growth: Zap,
  aggressive: Rocket,
};

const riskColors: Record<string, { badge: string; icon: string }> = {
  conservative: { badge: "bg-blue-400/10 text-blue-400", icon: "text-blue-400" },
  moderate: { badge: "bg-primary/10 text-primary", icon: "text-primary" },
  growth: { badge: "bg-amber-400/10 text-amber-400", icon: "text-amber-400" },
  aggressive: { badge: "bg-destructive/10 text-destructive", icon: "text-destructive" },
};

// ─── Feature bullets auto-generated from plan data ────────────────────────────

const planFeatures = (plan: any): string[] => {
  const features = [
    `${plan.expected_return_min}–${plan.expected_return_max}% expected return`,
    `${plan.duration_days}-day investment term`,
  ];
  if (plan.risk_level === "conservative") features.push("Capital preservation focus");
  if (plan.risk_level === "moderate") features.push("Balanced diversification");
  if (plan.risk_level === "growth") features.push("High-conviction positions");
  if (plan.risk_level === "aggressive") features.push("Maximum growth exposure");
  return features;
};

// ─── Skeleton card ─────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
    <div className="w-10 h-10 rounded-lg bg-secondary mb-4" />
    <div className="h-5 bg-secondary rounded w-2/3 mb-2" />
    <div className="h-3 bg-secondary rounded w-1/3 mb-6" />
    <div className="h-8 bg-secondary rounded w-1/2 mb-1" />
    <div className="h-3 bg-secondary rounded w-1/3 mb-6" />
    <div className="space-y-2 mb-6">
      <div className="h-3 bg-secondary rounded" />
      <div className="h-3 bg-secondary rounded" />
    </div>
    <div className="h-8 bg-secondary rounded" />
  </div>
);

// ─── Main component ────────────────────────────────────────────────────────────

const InvestmentPlansPreview = () => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("investment_plans")
      .select("id, name, risk_level, min_investment, max_investment, expected_return_min, expected_return_max, duration_days")
      .eq("is_active", true)
      .order("min_investment")
      .then(({ data }) => {
        if (data) setPlans(data);
        setLoading(false);
      });
  }, []);

  // Mark the middle plan (or 2nd) as "Most Popular"
  const popularIdx = plans.length > 1 ? 1 : 0;

  return (
    <section id="plans" className="px-6 lg:px-12 py-24 bg-surface">
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="font-mono text-xs text-primary tracking-wider uppercase mb-4 block">
            {t("plansPreview.label")}
          </span>
          <h2 className="font-display text-5xl sm:text-6xl text-foreground mb-4">
            {t("plansPreview.title")}
          </h2>
          <p className="font-body text-muted-foreground max-w-md mx-auto">
            {t("plansPreview.subtitle")}
          </p>
        </motion.div>

        {/* Cards grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {plans.map((plan, i) => {
              const isPopular = i === popularIdx;
              const isEnterprise = plan.min_investment >= ENTERPRISE_THRESHOLD;
              const Icon = riskIcons[plan.risk_level] ?? Shield;
              const colors = riskColors[plan.risk_level] ?? riskColors.moderate;
              const features = planFeatures(plan);

              return (
                <motion.div
                  key={plan.id}
                  variants={item}
                  whileHover={{ y: -8, transition: { duration: 0.25 } }}
                  className={`relative bg-card border rounded-lg p-6 transition-all cursor-pointer flex flex-col ${isEnterprise
                      ? "border-amber-400/40 shadow-[0_0_30px_hsl(45_100%_65%/0.08)]"
                      : isPopular
                        ? "border-primary/40 shadow-[0_0_30px_hsl(130_100%_65%/0.08)]"
                        : "border-border hover:border-border-light"
                    }`}
                >
                  {/* Badge */}
                  {(isPopular || isEnterprise) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5, type: "spring" }}
                      className="absolute -top-3 left-1/2 -translate-x-1/2"
                    >
                      <span className={`font-mono text-[10px] px-3 py-1 rounded-pill font-bold ${isEnterprise
                          ? "bg-amber-400 text-black"
                          : "bg-primary text-primary-foreground"
                        }`}>
                        {isEnterprise ? "ENTERPRISE" : t("plansPreview.mostPopular")}
                      </span>
                    </motion.div>
                  )}

                  {/* Icon */}
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${colors.badge}`}
                  >
                    {isEnterprise
                      ? <Star size={18} className="text-amber-400" />
                      : <Icon size={18} className={colors.icon} />
                    }
                  </motion.div>

                  {/* Name + risk */}
                  <h3 className="font-heading font-bold text-lg text-foreground mb-1">{plan.name}</h3>
                  <p className="font-mono text-xs text-muted-foreground capitalize mb-4">{plan.risk_level}</p>

                  {/* Return range */}
                  <p className="font-display text-3xl text-foreground mb-1">
                    {isEnterprise
                      ? `${plan.expected_return_min}%+`
                      : `${plan.expected_return_min}–${plan.expected_return_max}%`
                    }
                  </p>
                  <p className="font-body text-xs text-muted-foreground mb-5">
                    {t("plansPreview.expectedReturn")}
                  </p>

                  {/* Stats */}
                  <div className="space-y-2 mb-5">
                    <div className="flex justify-between font-body text-xs">
                      <span className="text-muted-foreground">{t("plansPreview.minInvestment")}</span>
                      <span className="text-foreground font-medium">
                        ${plan.min_investment.toLocaleString()}
                        {isEnterprise && "+"}
                      </span>
                    </div>
                    <div className="flex justify-between font-body text-xs">
                      <span className="text-muted-foreground">{t("plansPreview.duration")}</span>
                      <span className="text-foreground font-medium">{plan.duration_days} days</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6 flex-1">
                    {features.map((f) => (
                      <li key={f} className="font-body text-xs text-muted-foreground flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isEnterprise ? (
                    <a href={`mailto:${ENTERPRISE_EMAIL}?subject=Enterprise Investment Enquiry`}>
                      <Button variant="hero-ghost" className="w-full text-xs gap-1" size="sm">
                        <Mail size={11} /> Contact Us
                      </Button>
                    </a>
                  ) : (
                    <Link to="/signup">
                      <Button
                        variant={isPopular ? "hero" : "hero-ghost"}
                        className="w-full text-xs"
                        size="sm"
                      >
                        {t("common.getStarted")} <ArrowUpRight size={12} />
                      </Button>
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default InvestmentPlansPreview;
