import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import type { Database } from "@/integrations/supabase/types";

type PlanRisk = Database["public"]["Enums"]["plan_risk_level"];

interface PlanForm {
  name: string;
  description: string;
  risk_level: PlanRisk;
  min_investment: number;
  max_investment: number | null;
  expected_return_min: number | null;
  expected_return_max: number | null;
  duration_days: number;
  is_active: boolean;
}

const emptyForm: PlanForm = {
  name: "",
  description: "",
  risk_level: "moderate",
  min_investment: 100,
  max_investment: null,
  expected_return_min: null,
  expected_return_max: null,
  duration_days: 30,
  is_active: true,
};

const AdminPlans = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    const { data } = await supabase.from("investment_plans").select("*").order("created_at");
    if (data) setPlans(data);
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, []);

  const openEdit = (plan: any) => {
    setForm({
      name: plan.name,
      description: plan.description || "",
      risk_level: plan.risk_level,
      min_investment: plan.min_investment,
      max_investment: plan.max_investment,
      expected_return_min: plan.expected_return_min,
      expected_return_max: plan.expected_return_max,
      duration_days: plan.duration_days,
      is_active: plan.is_active,
    });
    setEditing(plan.id);
    setShowForm(true);
  };

  const openNew = () => {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);

    if (editing) {
      const { error } = await supabase.from("investment_plans").update(form).eq("id", editing);
      if (error) toast.error(error.message);
      else toast.success("Plan updated");
    } else {
      const { error } = await supabase.from("investment_plans").insert(form);
      if (error) toast.error(error.message);
      else toast.success("Plan created");
    }

    setSaving(false);
    setShowForm(false);
    setEditing(null);
    fetchPlans();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("investment_plans").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Plan deleted");
      fetchPlans();
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("investment_plans").update({ is_active: !current }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(current ? "Plan deactivated" : "Plan activated");
      fetchPlans();
    }
  };

  const riskColors: Record<string, string> = {
    conservative: "bg-blue-400/10 text-blue-400",
    moderate: "bg-accent-dim text-primary",
    growth: "bg-amber-400/10 text-amber-400",
    aggressive: "bg-destructive/10 text-destructive",
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-bold text-3xl text-foreground mb-1">Investment Plans</h1>
            <p className="font-body text-sm text-muted-foreground">Create and manage investment plans</p>
          </div>
          <Button variant="hero" onClick={openNew} className="gap-2"><Plus size={16} /> New Plan</Button>
        </motion.div>

        {/* Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-base text-foreground">{editing ? "Edit Plan" : "New Plan"}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-body text-sm text-muted-foreground">Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 bg-input border-border text-foreground" required />
                </div>
                <div>
                  <Label className="font-body text-sm text-muted-foreground">Risk Level</Label>
                  <select value={form.risk_level} onChange={(e) => setForm({ ...form, risk_level: e.target.value as PlanRisk })} className="mt-1.5 w-full h-10 px-3 rounded-md bg-input border border-border text-foreground text-sm font-body">
                    <option value="conservative">Conservative</option>
                    <option value="moderate">Moderate</option>
                    <option value="growth">Growth</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>
              </div>
              <div>
                <Label className="font-body text-sm text-muted-foreground">Description</Label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1.5 w-full rounded-md bg-input border border-border text-foreground text-sm font-body p-3 resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <Label className="font-body text-sm text-muted-foreground">Min Investment ($)</Label>
                  <Input type="number" value={form.min_investment} onChange={(e) => setForm({ ...form, min_investment: Number(e.target.value) })} className="mt-1.5 bg-input border-border text-foreground" />
                </div>
                <div>
                  <Label className="font-body text-sm text-muted-foreground">Max Investment ($)</Label>
                  <Input type="number" value={form.max_investment ?? ""} onChange={(e) => setForm({ ...form, max_investment: e.target.value ? Number(e.target.value) : null })} className="mt-1.5 bg-input border-border text-foreground" />
                </div>
                <div>
                  <Label className="font-body text-sm text-muted-foreground">Return Min (%)</Label>
                  <Input type="number" step="0.01" value={form.expected_return_min ?? ""} onChange={(e) => setForm({ ...form, expected_return_min: e.target.value ? Number(e.target.value) : null })} className="mt-1.5 bg-input border-border text-foreground" />
                </div>
                <div>
                  <Label className="font-body text-sm text-muted-foreground">Return Max (%)</Label>
                  <Input type="number" step="0.01" value={form.expected_return_max ?? ""} onChange={(e) => setForm({ ...form, expected_return_max: e.target.value ? Number(e.target.value) : null })} className="mt-1.5 bg-input border-border text-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-body text-sm text-muted-foreground">Duration (days)</Label>
                  <Input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })} className="mt-1.5 bg-input border-border text-foreground" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="accent-primary" />
                    <span className="font-body text-sm text-foreground">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" variant="hero" disabled={saving}>{saving ? "Saving..." : editing ? "Update Plan" : "Create Plan"}</Button>
                <Button type="button" variant="hero-ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Plans List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-card border border-border rounded-lg h-20 animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-lg p-5 hover:border-border-light transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading font-bold text-base text-foreground">{plan.name}</h3>
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded-pill capitalize ${riskColors[plan.risk_level] || ""}`}>
                        {plan.risk_level}
                      </span>
                      {!plan.is_active && (
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-pill bg-muted text-muted-foreground">Inactive</span>
                      )}
                    </div>
                    <p className="font-body text-xs text-muted-foreground line-clamp-1">{plan.description}</p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-mono text-sm text-foreground">${plan.min_investment.toLocaleString()}</p>
                      <p className="font-body text-[10px] text-muted-foreground">Min. Investment</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm text-primary">{plan.expected_return_min}–{plan.expected_return_max}%</p>
                      <p className="font-body text-[10px] text-muted-foreground">Expected Return</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleActive(plan.id, plan.is_active)} className={`p-2 rounded-lg transition-colors ${plan.is_active ? "hover:bg-amber-400/10 text-amber-400" : "hover:bg-accent-dim text-primary"}`} title={plan.is_active ? "Deactivate" : "Activate"}>
                        {plan.is_active ? "⏸" : "▶"}
                      </button>
                      <button onClick={() => openEdit(plan)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(plan.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPlans;
