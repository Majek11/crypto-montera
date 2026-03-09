import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Shield, Activity, Camera, Trash2 } from "lucide-react";
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
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ display_name: "", phone: "", country: "", bio: "" });
  const [kycStatus, setKycStatus] = useState("pending");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [{ data: profileData, error: profileError }, { data: kycData, error: kycError }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("kyc_verifications").select("status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (profileError) toast.error(t("settings.profileLoadFailed"));
      else if (profileData) {
        setProfile(profileData);
        setAvatarUrl(profileData.avatar_url || null);
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
      toast.success(t("settings.profileUpdated"));
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error(t("settings.photoHint"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("settings.photoHint"));
      return;
    }

    setUploadingAvatar(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error(t("settings.photoUploadFailed") + ": " + uploadError.message);
      setUploadingAvatar(false);
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("user_id", user.id);

    if (updateError) {
      toast.error(t("settings.photoUploadFailed"));
    } else {
      setAvatarUrl(publicUrl);
      toast.success(t("settings.photoUpdated"));
    }
    setUploadingAvatar(false);
  };

  const handleAvatarRemove = async () => {
    if (!user) return;
    setUploadingAvatar(true);

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("user_id", user.id);

    if (error) {
      toast.error(error.message);
    } else {
      setAvatarUrl(null);
      toast.success(t("settings.photoRemoved"));
    }
    setUploadingAvatar(false);
  };

  const kycStatusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: "bg-muted text-muted-foreground", label: t("kyc.notStarted") },
    submitted: { color: "bg-amber-400/10 text-amber-400", label: t("kyc.submitted") },
    under_review: { color: "bg-blue-400/10 text-blue-400", label: t("kyc.underReview") },
    approved: { color: "bg-accent-dim text-primary", label: t("kyc.verified") },
    rejected: { color: "bg-destructive/10 text-destructive", label: t("kyc.rejected") },
  };

  const kycConfig = kycStatusConfig[kycStatus] || kycStatusConfig.pending;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-heading font-bold text-3xl text-foreground mb-1">{t("settings.title")}</h1>
          <p className="font-body text-sm text-muted-foreground">{t("settings.subtitle")}</p>
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
                <h3 className="font-heading font-bold text-base text-foreground">{t("settings.profile")}</h3>
                <p className="font-body text-xs text-muted-foreground">{t("settings.personalInfo")}</p>
              </div>
            </div>

            {/* Avatar Upload Section */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/30">
              <div className="relative group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-heading font-bold text-xl">
                      {(form.display_name || user?.email || "U")[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera size={18} className="text-white" />
                </button>
              </div>
              <div>
                <p className="font-body text-sm font-medium text-foreground mb-1">{t("settings.profilePhoto")}</p>
                <p className="font-body text-xs text-muted-foreground mb-2">{t("settings.photoHint")}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? t("common.loading") : t("settings.uploadPhoto")}
                  </Button>
                  {avatarUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAvatarRemove}
                      disabled={uploadingAvatar}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={14} className="mr-1" />
                      {t("settings.removePhoto")}
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
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
                    <Label className="font-body text-sm text-muted-foreground">{t("settings.displayName")}</Label>
                    <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="mt-1.5 bg-input border-border text-foreground" />
                  </div>
                  <div>
                    <Label className="font-body text-sm text-muted-foreground">{t("settings.email")}</Label>
                    <Input value={user?.email || ""} disabled className="mt-1.5 bg-input border-border text-muted-foreground" />
                  </div>
                  <div>
                    <Label className="font-body text-sm text-muted-foreground">{t("settings.phone")}</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 890" className="mt-1.5 bg-input border-border text-foreground" />
                  </div>
                  <div>
                    <Label className="font-body text-sm text-muted-foreground">{t("settings.country")}</Label>
                    <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="United States" className="mt-1.5 bg-input border-border text-foreground" />
                  </div>
                </div>
                <div>
                  <Label className="font-body text-sm text-muted-foreground">{t("settings.bio")}</Label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder={t("settings.bioPlaceholder")}
                    rows={3}
                    className="mt-1.5 w-full rounded-md bg-input border border-border text-foreground text-sm font-body p-3 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button type="submit" variant="hero" disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
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
                <h3 className="font-heading font-bold text-base text-foreground">{t("settings.security")}</h3>
                <p className="font-body text-xs text-muted-foreground">{t("settings.securitySub")}</p>
              </div>
            </div>
            <div className="space-y-0">
              <EmailVerificationStatus />
              <div className="flex items-center justify-between py-3 border-b border-border/30">
                <div>
                  <p className="font-body text-sm text-foreground">{t("settings.kycVerification")}</p>
                  <p className="font-body text-xs text-muted-foreground">{t("settings.kycSub")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-xs px-2 py-0.5 rounded-pill ${kycConfig.color}`}>{kycConfig.label}</span>
                  {(kycStatus === "pending" || kycStatus === "rejected") && (
                    <Link to="/kyc" className="font-body text-xs text-primary hover:underline">{t("settings.kycStart")}</Link>
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
                <h3 className="font-heading font-bold text-base text-foreground">{t("settings.activityLog")}</h3>
                <p className="font-body text-xs text-muted-foreground">{t("settings.activityLogSub")}</p>
              </div>
              <span className="font-body text-sm text-primary">{t("settings.viewActivity")}</span>
            </div>
          </Link>
        </motion.div>

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="bg-card border border-destructive/20 rounded-lg p-6">
            <h3 className="font-heading font-bold text-base text-foreground mb-2">{t("settings.dangerZone")}</h3>
            <p className="font-body text-sm text-muted-foreground mb-4">{t("settings.dangerZoneSub")}</p>
            <Button variant="destructive" onClick={signOut}>{t("common.signOut")}</Button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Settings;
