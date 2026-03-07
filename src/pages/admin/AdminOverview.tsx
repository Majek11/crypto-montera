import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, DollarSign, TrendingUp, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";

const AdminOverview = () => {
  const [stats, setStats] = useState({ users: 0, investments: 0, volume: 0, kycPending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [profilesRes, investmentsRes, kycRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("investments").select("amount"),
        supabase.from("kyc_verifications").select("id", { count: "exact", head: true }).in("status", ["submitted", "under_review"]),
      ]);

      const totalVolume = investmentsRes.data?.reduce((acc, inv) => acc + Number(inv.amount), 0) || 0;

      setStats({
        users: profilesRes.count || 0,
        investments: investmentsRes.data?.length || 0,
        volume: totalVolume,
        kycPending: kycRes.count || 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.users.toString(), icon: Users, color: "text-blue-400 bg-blue-400/10" },
    { label: "Active Investments", value: stats.investments.toString(), icon: TrendingUp, color: "text-primary bg-accent-dim" },
    { label: "Total Volume", value: `$${stats.volume.toLocaleString()}`, icon: DollarSign, color: "text-amber-400 bg-amber-400/10" },
    { label: "KYC Pending", value: stats.kycPending.toString(), icon: ShieldCheck, color: "text-destructive bg-destructive/10" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-heading font-bold text-3xl text-foreground mb-1">Admin Dashboard</h1>
          <p className="font-body text-sm text-muted-foreground">Platform overview and management</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-lg p-5 hover:border-border-light transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-body text-xs text-muted-foreground">{card.label}</span>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                  <card.icon size={16} />
                </div>
              </div>
              {loading ? (
                <div className="h-8 w-20 bg-secondary rounded animate-pulse" />
              ) : (
                <p className="font-mono text-2xl font-medium text-foreground">{card.value}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;
