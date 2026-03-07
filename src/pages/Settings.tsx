import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Shield, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import TwoFactorSetup from "@/components/security/TwoFactorSetup";
import EmailVerificationBanner, { EmailVerificationStatus } from "@/components/security/EmailVerificationBanner";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import type { Profile, KycVerification } from "@/types";

const profileSchema = z.object({
  display_name: z.string().trim().min(2).max(50),
  phone: z.string().trim().max(20).optional(),
  country: z.string().trim().max(50).optional(),
  bio: z.string().trim().max(250).optional(),
});

const Settings = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ display_name: "", phone: "", country: "", bio: "" });
  const [kycStatus, setKycStatus] = useState("pending");

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [{ data: profileData, error: profileError }, { data: kycData, error: kycError }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("kyc_verifications").select("status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (profileError) toast.error("Failed to load profile");
      else if (profileData) {
        setProfile(profileData);
        setForm({
          display_name: profileData.display_name || "",
          phone: profileData.phone || "",
          country: profileData.country || "",
          bio: profileData.bio || "",
        });
      }
      if (kycError) console.warn("KYC fetch error:", kycError.message);
      else if (kycData) setKycStatus((kycData as Pick<KycVerification, "status">).status);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = profileSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(form).eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      await logAudit({ action: "profile_updated", entity_type: "profile" });
      toast.success("Profile updated!");
    }
  };

  const kycStatusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: "bg-muted text-muted-foreground", label: "Not Started" },
    submitted: { color: "bg-amber-400/10 text-amber-400", label: "Submitted" },
    under_review: { color: "bg-blue-400/10 text-blue-400", label: "Under Review" },
    approved: { color: "bg-accent-dim text-primary", label: "Verified" },
    rejected: { color: "bg-destructive/10 text-destructive", label: "Rejected" },
  };

  const kycConfig = kycStatusConfig[kycStatus] || kycStatusConfig.pending;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-heading font-bold text-3xl text-foreground mb-1">Settings</h1>
          <p className="font-body text-sm text-muted-foreground">Manage your profile and security</p>
        </motion.div>

        {/* Email Verification Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <EmailVerificationBanner />
        </motion.div>

        {/* Profile Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center">
                <User size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-foreground">Profile</h3>
                <p className="font-body text-xs text-muted-foreground">Your personal information</p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-secondary rounded animate-pulse" />)}
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-body text-sm text-muted-foreground">Display Name</Label>
                    <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="mt-1.5 bg-input border-border text-foreground" />
                  </div>
                  <div>
                    <Label className="font-body text-sm text-muted-foreground">Email</Label>
                    <Input value={user?.email || ""} disabled className="mt-1.5 bg-input border-border text-muted-foreground" />
                  </div>
                  <div>
                    <Label className="font-body text-sm text-muted-foreground">Phone</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 890" className="mt-1.5 bg-input border-border text-foreground" />
                  </div>
                  <div>
                    <Label className="font-body text-sm text-muted-foreground">Country</Label>
                    <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="United States" className="mt-1.5 bg-input border-border text-foreground" />
                  </div>
                </div>
                <div>
                  <Label className="font-body text-sm text-muted-foreground">Bio</Label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="mt-1.5 w-full rounded-md bg-input border border-border text-foreground text-sm font-body p-3 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button type="submit" variant="hero" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
              </form>
            )}
          </div>
        </motion.div>

        {/* Security Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center">
                <Shield size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-foreground">Security Status</h3>
                <p className="font-body text-xs text-muted-foreground">Account verification overview</p>
              </div>
            </div>
            <div className="space-y-0">
              <EmailVerificationStatus />
              <div className="flex items-center justify-between py-3 border-b border-border/30">
                <div>
                  <p className="font-body text-sm text-foreground">KYC Verification</p>
                  <p className="font-body text-xs text-muted-foreground">Identity verification for higher limits</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-xs px-2 py-0.5 rounded-pill ${kycConfig.color}`}>{kycConfig.label}</span>
                  {(kycStatus === "pending" || kycStatus === "rejected") && (
                    <Link to="/kyc" className="font-body text-xs text-primary hover:underline">Start →</Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2FA Setup */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
          <TwoFactorSetup />
        </motion.div>

        {/* Activity Log Link */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Link to="/activity" className="block bg-card border border-border rounded-lg p-5 hover:border-border-light transition-colors mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center">
                <Activity size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-bold text-base text-foreground">Activity Log</h3>
                <p className="font-body text-xs text-muted-foreground">View recent account activity and security events</p>
              </div>
              <span className="font-body text-sm text-primary">View →</span>
            </div>
          </Link>
        </motion.div>

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="bg-card border border-destructive/20 rounded-lg p-6">
            <h3 className="font-heading font-bold text-base text-foreground mb-2">Danger Zone</h3>
            <p className="font-body text-sm text-muted-foreground mb-4">Sign out of your account</p>
            <Button variant="destructive" onClick={signOut}>Sign Out</Button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Settings;
