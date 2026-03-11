import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, TrendingUp, Zap, Rocket, ArrowUpRight, Clock,
  DollarSign, CheckCircle, BarChart3, CalendarClock, Target,
  Wallet, AlertCircle, X, ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import type { InvestmentPlan, Investment } from "@/types";
import SEO from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

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

const getProgress = (inv: Investment) => {
  if (!inv.ends_at) return { pct: 0, daysLeft: null, daysTotal: null, daysElapsed: 0 };
  const now = Date.now();
  const start = new Date(inv.started_at).getTime();
  const end = new Date(inv.ends_at).getTime();
  const total = end - start;
  const elapsed = Math.min(now - start, total);
  const pct = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0;
  const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
  const daysTotal = Math.round(total / 86400000);
  const daysElapsed = Math.round(elapsed / 86400000);
  return { pct, daysLeft, daysTotal, daysElapsed };
};

// ── Investment Modal ──────────────────────────────────────────────────────────
interface InvestModalProps {
  plan: InvestmentPlan;
  balance: number;
  onClose: () => void;
  onSuccess: (inv: Investment) => void;
}

const InvestModal = ({ plan, balance, onClose, onSuccess }: InvestModalProps) => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(String(plan.min_investment));
  const [submitting, setSubmitting] = useState(false);

  const numAmount = Number(amount) || 0;
  const insufficient = numAmount > balance;
  const belowMin = numAmount < plan.min_investment;
  const aboveMax = plan.max_investment ? numAmount > plan.max_investment : false;
  const canInvest = !insufficient && !belowMin && !aboveMax && numAmount > 0;

  const handleInvest = async () => {
    setSubmitting(true);
    const { data, error } = await supabase.rpc("create_investment", {
      p_plan_id: plan.id,
      p_amount: numAmount,
    });

    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Investment failed");
      setSubmitting(false);
      return;
    }

    // Fetch the new investment to update UI
    const { data: invData } = await supabase
      .from("investments")
      .select("*, investment_plans(*)")
      .eq("id", data.investment_id)
      .single();

    toast.success(`🎉 Successfully invested $${numAmount.toLocaleString()} in ${plan.name}!`);
    if (invData) onSuccess(invData as Investment);
    onClose();
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <X size={16} />
        </button>

        {/* Plan header */}
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${riskColors[plan.risk_level] || riskColors.conservative}`}>
            {(() => { const Icon = riskIcons[plan.risk_level] || Shield; return <Icon size={16} />; })()}
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-foreground">{plan.name}</h3>
            <p className="font-mono text-xs text-muted-foreground capitalize">{plan.risk_level} · {plan.duration_days} days · {plan.expected_return_min}–{plan.expected_return_max}% return</p>
          </div>
        </div>

        {/* Available balance */}
        <div className="flex items-center justify-between bg-secondary rounded-lg px-4 py-3 mb-4">
          <div className="flex items-center gap-2">
            <Wallet size={14} className="text-muted-foreground" />
            <span className="font-body text-sm text-muted-foreground">Available Balance</span>
          </div>
          <span className="font-mono text-sm font-bold text-foreground">${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
        </div>

        {/* Amount input */}
        <div className="mb-4">
          <label className="font-body text-sm text-muted-foreground mb-1.5 block">Investment Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground text-sm">$</span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-7 bg-input border-border text-foreground font-mono text-lg"
              min={plan.min_investment}
              max={plan.max_investment ?? undefined}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="font-body text-xs text-muted-foreground">Min: ${plan.min_investment.toLocaleString()}</span>
            {plan.max_investment && (
              <span className="font-body text-xs text-muted-foreground">Max: ${plan.max_investment.toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Quick amount buttons */}
        <div className="flex gap-2 mb-4">
          {[plan.min_investment, plan.min_investment * 2, plan.min_investment * 5].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(String(v))}
              disabled={v > balance}
              className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition-colors ${Number(amount) === v ? "bg-accent-dim text-primary border border-primary/30" : "bg-secondary text-muted-foreground hover:text-foreground"} disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              ${v.toLocaleString()}
            </button>
          ))}
          <button
            onClick={() => setAmount(String(Math.min(balance, plan.max_investment ?? balance)))}
            disabled={balance < plan.min_investment}
            className="flex-1 py-1.5 rounded-lg text-xs font-mono bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Max
          </button>
        </div>

        {/* Validation errors */}
        {insufficient && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 mb-4">
            <AlertCircle size={14} className="text-destructive flex-shrink-0" />
            <p className="font-body text-xs text-destructive">
              Insufficient balance.{" "}
              <button
                className="underline font-medium"
                onClick={() => { onClose(); navigate("/deposit"); }}
              >
                Deposit funds first →
              </button>
            </p>
          </div>
        )}
        {belowMin && !insufficient && (
          <div className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2 mb-4">
            <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
            <p className="font-body text-xs text-amber-400">Minimum investment for this plan is ${plan.min_investment.toLocaleString()}</p>
          </div>
        )}

        {/* Projected returns */}
        {canInvest && (
          <div className="bg-accent-dim/30 border border-primary/15 rounded-lg px-4 py-3 mb-5">
            <p className="font-body text-xs text-muted-foreground mb-1">Projected returns after {plan.duration_days} days</p>
            <div className="flex justify-between">
              <span className="font-mono text-xs text-muted-foreground">Min ({plan.expected_return_min}%)</span>
              <span className="font-mono text-sm text-primary font-bold">+${(numAmount * plan.expected_return_min / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-xs text-muted-foreground">Max ({plan.expected_return_max}%)</span>
              <span className="font-mono text-sm text-primary font-bold">+${(numAmount * plan.expected_return_max / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        <Button variant="hero" className="w-full py-5 gap-2" onClick={handleInvest} disabled={!canInvest || submitting}>
          {submitting ? (
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <>{insufficient ? "Deposit Funds First" : `Confirm Investment — $${numAmount.toLocaleString()}`} <ArrowRight size={14} /></>
          )}
        </Button>
      </motion.div>
    </div>
  );
};

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyPlansState = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-20 h-20 rounded-2xl bg-accent-dim flex items-center justify-center mb-5">
      <BarChart3 size={36} className="text-primary" />
    </div>
    <h2 className="font-heading font-bold text-xl text-foreground mb-2">No Plans Available Yet</h2>
    <p className="font-body text-sm text-muted-foreground max-w-sm mb-6">
      Our team is finalising investment plans for you. Check back soon!
    </p>
    <Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
  </motion.div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const Plans = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [investingPlan, setInvestingPlan] = useState<InvestmentPlan | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [plansRes, investmentsRes, profileRes] = await Promise.all([
        supabase.from("investment_plans").select("*").eq("is_active", true).order("min_investment"),
        user
          ? supabase.from("investments").select("*, investment_plans(*)").eq("user_id", user.id).in("status", ["active", "completed"])
          : Promise.resolve({ data: [], error: null }),
        user
          ? supabase.from("profiles").select("balance").eq("user_id", user.id).single()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (plansRes.error) { setError(true); }
      else if (plansRes.data) setPlans(plansRes.data);

      if (investmentsRes.data) setInvestments(investmentsRes.data as Investment[]);
      if (profileRes.data) setBalance(Number((profileRes.data as any).balance) || 0);

      setLoading(false);
    };
    fetchData();
  }, [user]);

  const subscribedPlanIds = useMemo(
    () => new Set(investments.filter((inv) => inv.status === "active").map((inv) => inv.plan_id)),
    [investments]
  );

  const activeInvestments = investments.filter((inv) => inv.status === "active");

  const handleInvestClick = (plan: InvestmentPlan) => {
    if (!user) { toast.error("Please sign in to invest"); navigate("/login"); return; }
    setInvestingPlan(plan);
  };

  const renderPlanCard = (plan: InvestmentPlan, i: number, isSubscribed: boolean) => {
    const Icon = riskIcons[plan.risk_level] || Shield;
    const colorClass = riskColors[plan.risk_level] || riskColors.conservative;
    const allocation = plan.allocation as Record<string, number> | null;
    const canAfford = balance >= plan.min_investment;

    return (
      <motion.div
        key={plan.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.08 }}
        className="bg-card border border-border rounded-lg p-6 hover:border-primary/30 transition-all group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorClass}`}>
                <Icon size={16} />
              </div>
              <span className={`font-mono text-xs px-2 py-0.5 rounded-pill capitalize ${colorClass}`}>{plan.risk_level}</span>
            </div>
            <h3 className="font-heading font-bold text-xl text-foreground">{plan.name}</h3>
          </div>
        </div>

        <p className="font-body text-sm text-muted-foreground mb-5 leading-relaxed">{plan.description}</p>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div>
            <p className="font-body text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><DollarSign size={10} />Min</p>
            <p className="font-mono text-sm text-foreground">${plan.min_investment.toLocaleString()}</p>
          </div>
          <div>
            <p className="font-body text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><TrendingUp size={10} />Returns</p>
            <p className="font-mono text-sm text-primary">{plan.expected_return_min}–{plan.expected_return_max}%</p>
          </div>
          <div>
            <p className="font-body text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Clock size={10} />Duration</p>
            <p className="font-mono text-sm text-foreground">{plan.duration_days}d</p>
          </div>
        </div>

        {allocation && (
          <div className="mb-5">
            <p className="font-body text-xs text-muted-foreground mb-2">Allocation</p>
            <div className="flex gap-1 h-2 rounded-full overflow-hidden">
              {Object.entries(allocation).map(([token, pct]) => (
                <div key={token} className="bg-primary/60 first:rounded-l-full last:rounded-r-full hover:bg-primary transition-colors" style={{ width: `${pct}%` }} title={`${token}: ${pct}%`} />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {Object.entries(allocation).map(([token, pct]) => (
                <span key={token} className="font-mono text-xs text-muted-foreground">{token} {pct}%</span>
              ))}
            </div>
          </div>
        )}

        {isSubscribed ? (
          <Button variant="outline" className="w-full py-5 cursor-default" disabled>
            <CheckCircle size={14} className="mr-2 text-primary" /> Active Investment
          </Button>
        ) : (
          <div className="space-y-2">
            <Button variant="hero" className="w-full py-5" onClick={() => handleInvestClick(plan)}>
              Invest Now <ArrowUpRight size={14} />
            </Button>
            {!canAfford && user && (
              <button
                onClick={() => navigate("/deposit")}
                className="font-body text-[11px] text-amber-400 text-center flex items-center justify-center gap-1 w-full hover:text-amber-300 transition-colors"
              >
                <AlertCircle size={10} /> Need ${(plan.min_investment - balance).toLocaleString()} more — Deposit now →
              </button>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <AppLayout>
      <SEO title="Investment Plans" description="Browse and invest in Montera's crypto investment plans." noIndex />

      {/* Investment Modal */}
      <AnimatePresence>
        {investingPlan && (
          <InvestModal
            plan={investingPlan}
            balance={balance}
            onClose={() => setInvestingPlan(null)}
            onSuccess={(inv) => {
              setInvestments((prev) => [...prev, inv]);
              setBalance((b) => b - inv.amount);
            }}
          />
        )}
      </AnimatePresence>

      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header + Balance Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="font-heading font-bold text-3xl text-foreground mb-2">Investment Plans</h1>
            <p className="font-body text-sm text-muted-foreground max-w-lg">Choose a managed portfolio that matches your risk appetite.</p>
          </div>
          {user && (
            <div className="flex-shrink-0 bg-card border border-primary/20 rounded-lg px-5 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-dim flex items-center justify-center">
                <Wallet size={14} className="text-primary" />
              </div>
              <div>
                <p className="font-body text-xs text-muted-foreground">Available to Invest</p>
                <p className="font-mono text-lg font-bold text-primary">${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              </div>
              {balance === 0 && (
                <Button variant="hero" size="sm" onClick={() => navigate("/deposit")} className="ml-2">
                  Deposit
                </Button>
              )}
            </div>
          )}
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-card border border-border rounded-lg h-72 animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Active Investments with Progress Bars */}
            {activeInvestments.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                <h2 className="font-heading font-bold text-xl text-foreground mb-4">Your Active Investments</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeInvestments.map((inv) => {
                    const plan = inv.investment_plans;
                    const colorClass = riskColors[plan?.risk_level || "conservative"];
                    const Icon = riskIcons[plan?.risk_level || "conservative"] || Shield;
                    const totalReturn = (inv.current_value || inv.amount) - inv.amount;
                    const returnPct = inv.amount > 0 ? ((totalReturn / inv.amount) * 100).toFixed(1) : "0.0";
                    const { pct, daysLeft, daysTotal, daysElapsed } = getProgress(inv);

                    return (
                      <motion.div key={inv.id} className="bg-card border border-primary/20 rounded-lg p-5" whileHover={{ y: -2 }}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}><Icon size={14} /></div>
                          <div>
                            <h4 className="font-heading font-bold text-sm text-foreground">{plan?.name || "Plan"}</h4>
                            <p className="font-mono text-xs text-muted-foreground">{new Date(inv.started_at).toLocaleDateString()}</p>
                          </div>
                          <span className="ml-auto font-mono text-xs px-2 py-0.5 rounded-pill bg-accent-dim text-primary capitalize">{inv.status}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div><p className="font-body text-xs text-muted-foreground">Invested</p><p className="font-mono text-sm text-foreground">${inv.amount.toLocaleString()}</p></div>
                          <div><p className="font-body text-xs text-muted-foreground">Current Value</p><p className="font-mono text-sm text-foreground">${(inv.current_value || inv.amount).toLocaleString()}</p></div>
                          <div><p className="font-body text-xs text-muted-foreground">Return</p><p className={`font-mono text-sm ${totalReturn >= 0 ? "text-primary" : "text-destructive"}`}>{totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(2)} ({returnPct}%)</p></div>
                          {daysLeft !== null && <div><p className="font-body text-xs text-muted-foreground flex items-center gap-1"><CalendarClock size={10} />Matures In</p><p className="font-mono text-sm text-foreground">{daysLeft}d left</p></div>}
                        </div>
                        {daysTotal && (
                          <div>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="font-body text-[10px] text-muted-foreground flex items-center gap-1"><Target size={9} />Progress</span>
                              <span className="font-mono text-[10px] text-muted-foreground">Day {daysElapsed} / {daysTotal}</span>
                            </div>
                            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                              <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
                            </div>
                            <p className="font-mono text-[10px] text-muted-foreground mt-1 text-right">{pct.toFixed(0)}% complete</p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Available Plans or Empty State */}
            {error ? (
              <div className="flex flex-col items-center py-16 text-center">
                <h2 className="font-heading font-bold text-lg text-foreground mb-2">Failed to Load Plans</h2>
                <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
              </div>
            ) : plans.length === 0 ? (
              <EmptyPlansState />
            ) : (
              <div>
                {activeInvestments.length > 0 && (
                  <h2 className="font-heading font-bold text-xl text-foreground mb-4">Available Plans</h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {plans.map((plan, i) => renderPlanCard(plan, i, subscribedPlanIds.has(plan.id)))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Plans;
