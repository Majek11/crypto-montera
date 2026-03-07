import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";

const COLORS = ["hsl(130, 100%, 65%)", "hsl(38, 90%, 50%)", "hsl(230, 60%, 55%)", "hsl(270, 80%, 60%)"];

const generateUserGrowth = () => {
  const data = [];
  let total = 50;
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    total += Math.floor(Math.random() * 30 + 10);
    data.push({ month: d.toLocaleDateString("en-US", { month: "short" }), users: total });
  }
  return data;
};

const generateVolumeData = () => {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    data.push({
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      volume: Math.floor(Math.random() * 50000 + 20000),
    });
  }
  return data;
};

const AdminAnalytics = () => {
  const [planDistribution, setPlanDistribution] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("investments")
        .select("plan_id, investment_plans(name)");

      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((inv: any) => {
          const name = inv.investment_plans?.name || "Unknown";
          counts[name] = (counts[name] || 0) + 1;
        });
        setPlanDistribution(Object.entries(counts).map(([name, value]) => ({ name, value })));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const userGrowth = generateUserGrowth();
  const volumeData = generateVolumeData();

  const tooltipStyle = {
    background: "hsl(0, 0%, 6.7%)",
    border: "1px solid hsl(0, 0%, 10%)",
    borderRadius: "8px",
    fontFamily: "JetBrains Mono",
    fontSize: "12px",
    color: "#fff",
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-heading font-bold text-3xl text-foreground mb-1">Analytics</h1>
          <p className="font-body text-sm text-muted-foreground">Platform performance metrics</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-lg p-5">
            <h3 className="font-heading font-bold text-base text-foreground mb-4">User Growth</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(130, 100%, 65%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(130, 100%, 65%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(0, 0%, 53%)", fontFamily: "JetBrains Mono" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(0, 0%, 53%)", fontFamily: "JetBrains Mono" }} width={40} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="users" stroke="hsl(130, 100%, 65%)" strokeWidth={2} fill="url(#userGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Trading Volume */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-lg p-5">
            <h3 className="font-heading font-bold text-base text-foreground mb-4">Daily Volume</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={volumeData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(0, 0%, 53%)", fontFamily: "JetBrains Mono" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(0, 0%, 53%)", fontFamily: "JetBrains Mono" }} width={50} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`$${value.toLocaleString()}`, "Volume"]} />
                <Bar dataKey="volume" fill="hsl(130, 100%, 65%)" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Plan Distribution */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-lg p-5">
            <h3 className="font-heading font-bold text-base text-foreground mb-4">Investment Plan Distribution</h3>
            {planDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-48">
                <p className="font-body text-sm text-muted-foreground">No investment data yet</p>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={planDistribution} dataKey="value" cx="50%" cy="50%" outerRadius={80} strokeWidth={0}>
                      {planDistribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {planDistribution.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="font-body text-xs text-muted-foreground">{item.name}</span>
                      <span className="font-mono text-xs text-foreground ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Quick Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border rounded-lg p-5">
            <h3 className="font-heading font-bold text-base text-foreground mb-4">Platform Metrics</h3>
            <div className="space-y-4">
              {[
                { label: "Avg. Investment Size", value: "$2,450" },
                { label: "Avg. Portfolio Return", value: "+14.2%" },
                { label: "User Retention (30d)", value: "87%" },
                { label: "Active Sessions (now)", value: "142" },
                { label: "Total Wallets Connected", value: "328" },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <span className="font-body text-sm text-muted-foreground">{m.label}</span>
                  <span className="font-mono text-sm text-foreground">{m.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
