import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, LogIn, LogOut, Shield, Wallet, TrendingUp, FileCheck, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { toast } from "sonner";
import type { AuditLog } from "@/types";

const actionIcons: Record<string, any> = {
  login: LogIn,
  logout: LogOut,
  signup: LogIn,
  kyc_submitted: FileCheck,
  mfa_enabled: Shield,
  mfa_disabled: Shield,
  wallet_added: Wallet,
  wallet_deleted: Wallet,
  investment_created: TrendingUp,
  profile_updated: Settings,
  password_reset: Shield,
};

const actionLabels: Record<string, string> = {
  login: "Signed in",
  logout: "Signed out",
  signup: "Account created",
  kyc_submitted: "KYC documents submitted",
  mfa_enabled: "2FA enabled",
  mfa_disabled: "2FA disabled",
  wallet_added: "Wallet added",
  wallet_deleted: "Wallet removed",
  investment_created: "Investment created",
  profile_updated: "Profile updated",
  password_reset: "Password reset requested",
};

const ActivityLog = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) toast.error("Failed to load activity log");
      else setLogs(data || []);
      setLoading(false);
    };
    fetchLogs();
  }, [user]);

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-heading font-bold text-3xl text-foreground mb-1">Activity Log</h1>
          <p className="font-body text-sm text-muted-foreground">Recent security and account activity</p>
        </motion.div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-card border border-border rounded-lg h-16 animate-pulse" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <Activity size={40} className="text-muted-foreground mx-auto mb-4" />
            <p className="font-heading font-bold text-lg text-foreground mb-1">No activity yet</p>
            <p className="font-body text-sm text-muted-foreground">Your account activity will appear here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log: any, i: number) => {
              const Icon = actionIcons[log.action] || Activity;
              const label = actionLabels[log.action] || log.action;
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-card transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-foreground">{label}</p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <p className="font-mono text-[10px] text-muted-foreground truncate">
                        {Object.entries(log.metadata).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                      </p>
                    )}
                  </div>
                  <span className="font-mono text-xs text-muted-foreground flex-shrink-0">{formatTime(log.created_at)}</span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ActivityLog;
