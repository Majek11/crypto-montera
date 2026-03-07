import { useState } from "react";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);

  if (!user) return null;

  const isVerified = user.email_confirmed_at != null;

  if (isVerified) return null;

  const resendVerification = async () => {
    if (!user.email) return;
    setSending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: { emailRedirectTo: window.location.origin },
    });
    setSending(false);
    if (error) toast.error(error.message);
    else toast.success("Verification email sent! Check your inbox.");
  };

  return (
    <div className="bg-amber-400/10 border border-amber-400/20 rounded-lg p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0">
        <Mail size={18} className="text-amber-400" />
      </div>
      <div className="flex-1">
        <p className="font-body text-sm font-medium text-foreground">Verify your email address</p>
        <p className="font-body text-xs text-muted-foreground">
          Check your inbox for a verification link sent to <span className="text-foreground">{user.email}</span>
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={resendVerification} disabled={sending} className="flex-shrink-0">
        {sending ? "Sending..." : "Resend"}
      </Button>
    </div>
  );
};

export const EmailVerificationStatus = () => {
  const { user } = useAuth();
  if (!user) return null;
  const isVerified = user.email_confirmed_at != null;

  return (
    <div className="flex items-center justify-between py-3 border-b border-border/30">
      <div>
        <p className="font-body text-sm text-foreground">Email Verification</p>
        <p className="font-body text-xs text-muted-foreground">{user.email}</p>
      </div>
      {isVerified ? (
        <span className="font-mono text-xs px-2 py-0.5 rounded-pill bg-accent-dim text-primary flex items-center gap-1">
          <CheckCircle2 size={10} /> Verified
        </span>
      ) : (
        <span className="font-mono text-xs px-2 py-0.5 rounded-pill bg-amber-400/10 text-amber-400 flex items-center gap-1">
          <AlertCircle size={10} /> Unverified
        </span>
      )}
    </div>
  );
};

export default EmailVerificationBanner;
