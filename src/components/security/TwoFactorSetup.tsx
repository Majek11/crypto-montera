import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ShieldCheck, ShieldOff, Copy, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

interface TwoFactorSetupProps {
  onStatusChange?: (enabled: boolean) => void;
}

const TwoFactorSetup = ({ onStatusChange }: TwoFactorSetupProps) => {
  const [step, setStep] = useState<"idle" | "enrolling" | "verifying" | "enabled">("idle");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check MFA status on mount
  useState(() => {
    const check = async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const totp = data?.totp?.find((f) => f.status === "verified");
      if (totp) {
        setMfaEnabled(true);
        setFactorId(totp.id);
        setStep("enabled");
      }
    };
    check();
  });

  const startEnrollment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Monetra Authenticator" });
      if (error) throw error;
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep("enrolling");
    } catch (err: any) {
      toast.error(err.message || "Failed to start 2FA setup");
    } finally {
      setLoading(false);
    }
  };

  const verifyEnrollment = async () => {
    if (verifyCode.length !== 6) {
      toast.error("Enter a 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeErr) throw challengeErr;

      const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: verifyCode });
      if (verifyErr) throw verifyErr;

      setMfaEnabled(true);
      setStep("enabled");
      await logAudit({ action: "mfa_enabled", entity_type: "security" });
      onStatusChange?.(true);
      toast.success("Two-factor authentication enabled!");
    } catch (err: any) {
      toast.error(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const disableMFA = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      setMfaEnabled(false);
      setStep("idle");
      setFactorId("");
      await logAudit({ action: "mfa_disabled", entity_type: "security" });
      onStatusChange?.(false);
      toast.success("Two-factor authentication disabled");
    } catch (err: any) {
      toast.error(err.message || "Failed to disable 2FA");
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center">
          <Shield size={18} className="text-primary" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-base text-foreground">Two-Factor Authentication</h3>
          <p className="font-body text-xs text-muted-foreground">Secure your account with TOTP</p>
        </div>
        {mfaEnabled && (
          <span className="ml-auto font-mono text-xs px-2 py-0.5 rounded-pill bg-accent-dim text-primary">Active</span>
        )}
      </div>

      {step === "idle" && (
        <div>
          <p className="font-body text-sm text-muted-foreground mb-4">
            Add an extra layer of security by requiring a code from your authenticator app when signing in.
          </p>
          <Button variant="hero" onClick={startEnrollment} disabled={loading}>
            {loading ? "Setting up..." : "Enable 2FA"}
          </Button>
        </div>
      )}

      {step === "enrolling" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-body text-sm text-muted-foreground mb-4">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
          </p>

          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="bg-foreground p-3 rounded-lg">
              <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            </div>

            <div className="w-full">
              <Label className="font-body text-xs text-muted-foreground mb-1 block">Or enter this key manually:</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-input border border-border rounded-md px-3 py-2 font-mono text-xs text-foreground break-all">
                  {secret}
                </code>
                <button onClick={copySecret} className="p-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors">
                  {copied ? <CheckCircle2 size={14} className="text-primary" /> : <Copy size={14} className="text-muted-foreground" />}
                </button>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <Label className="font-body text-sm text-muted-foreground mb-1.5 block">Enter the 6-digit code from your app:</Label>
            <Input
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="bg-input border-border text-foreground font-mono text-center text-lg tracking-[0.5em]"
              maxLength={6}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="hero" onClick={verifyEnrollment} disabled={loading || verifyCode.length !== 6}>
              {loading ? "Verifying..." : "Verify & Enable"}
            </Button>
            <Button variant="hero-ghost" onClick={() => { setStep("idle"); setVerifyCode(""); }}>Cancel</Button>
          </div>
        </motion.div>
      )}

      {step === "enabled" && (
        <div>
          <div className="flex items-center gap-3 p-4 bg-accent-dim rounded-lg mb-4">
            <ShieldCheck size={20} className="text-primary" />
            <p className="font-body text-sm text-foreground">Two-factor authentication is active on your account.</p>
          </div>
          <Button variant="destructive" size="sm" onClick={disableMFA} disabled={loading}>
            <ShieldOff size={14} className="mr-1" />
            {loading ? "Disabling..." : "Disable 2FA"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup;
