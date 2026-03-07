import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, TrendingUp, Zap, Rocket, ArrowUpRight, Clock, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import type { InvestmentPlan } from "@/types";
import SEO from "@/components/SEO";

const riskIcons: Record<string, typeof Shield> = {
  conservative: Shield,
  moderate: TrendingUp,
  growth: Zap,
  aggressive: Rocket,
};

const riskColors: Record<string, string> = {
  conservative: "text-blue-400 bg-blue-400/10",
  moderate: "text-primary bg-accent-dim",
  growth: "text-amber-400 bg-amber-400/10",
  aggressive: "text-destructive bg-destructive/10",
};

const Plans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase.from("investment_plans").select("*").eq("is_active", true);
      if (error) toast.error("Failed to load investment plans");
      else if (data) setPlans(data);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (plan: InvestmentPlan) => {
    if (!user) return;
    setSubscribing(plan.id);

    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + plan.duration_days);

    const { error } = await supabase.from("investments").insert({
      user_id: user.id,
      plan_id: plan.id,
      amount: plan.min_investment,
      current_value: plan.min_investment,
      ends_at: endsAt.toISOString(),
    });

    if (error) {
      toast.error("Failed to subscribe: " + error.message);
    } else {
      toast.success(`Subscribed to ${plan.name}!`);
    }
    setSubscribing(null);
  };

  return (
    <AppLayout>
      <SEO title="Investment Plans" description="Browse and invest in Monetra's crypto investment plans. Flexible terms, zero fees, and real-time portfolio tracking." noIndex />
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-heading font-bold text-3xl text-foreground mb-2">Investment Plans</h1>
          <p className="font-body text-sm text-muted-foreground max-w-lg">
            Choose a managed portfolio that matches your risk appetite. Our algorithms automatically rebalance your assets for optimal performance.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg h-72 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan, i) => {
              const Icon = riskIcons[plan.risk_level] || Shield;
              const colorClass = riskColors[plan.risk_level] || riskColors.conservative;
              const allocation = plan.allocation as Record<string, number> | null;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border rounded-lg p-6 hover:border-border-light transition-all group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorClass}`}>
                          <Icon size={16} />
                        </div>
                        <span className={`font-mono text-xs px-2 py-0.5 rounded-pill capitalize ${colorClass}`}>
                          {plan.risk_level}
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-xl text-foreground">{plan.name}</h3>
                    </div>
                  </div>

                  <p className="font-body text-sm text-muted-foreground mb-5 leading-relaxed">{plan.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div>
                      <p className="font-body text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><DollarSign size={10} /> Min</p>
                      <p className="font-mono text-sm text-foreground">${plan.min_investment.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-body text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><TrendingUp size={10} /> Returns</p>
                      <p className="font-mono text-sm text-primary">{plan.expected_return_min}–{plan.expected_return_max}%</p>
                    </div>
                    <div>
                      <p className="font-body text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Clock size={10} /> Duration</p>
                      <p className="font-mono text-sm text-foreground">{plan.duration_days}d</p>
                    </div>
                  </div>

                  {/* Allocation */}
                  {allocation && (
                    <div className="mb-5">
                      <p className="font-body text-xs text-muted-foreground mb-2">Allocation</p>
                      <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                        {Object.entries(allocation).map(([token, pct]) => (
                          <div
                            key={token}
                            className="bg-primary/60 first:rounded-l-full last:rounded-r-full hover:bg-primary transition-colors"
                            style={{ width: `${pct}%` }}
                            title={`${token}: ${pct}%`}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                        {Object.entries(allocation).map(([token, pct]) => (
                          <span key={token} className="font-mono text-xs text-muted-foreground">
                            {token} {pct}%
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="hero"
                    className="w-full py-5"
                    onClick={() => handleSubscribe(plan)}
                    disabled={subscribing === plan.id}
                  >
                    {subscribing === plan.id ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>Invest Now <ArrowUpRight size={14} /></>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Plans;
