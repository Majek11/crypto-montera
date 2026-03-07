import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().trim().email("Invalid email address");

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error("Please enter a valid email address");
      return;
    }
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">◈</span>
          </div>
          <span className="font-heading font-bold text-lg text-foreground">Monetra</span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-accent-dim flex items-center justify-center mx-auto mb-6">
              <span className="text-primary text-2xl">✓</span>
            </div>
            <h2 className="font-heading font-bold text-2xl text-foreground mb-2">Check your email</h2>
            <p className="font-body text-sm text-muted-foreground mb-8">
              We've sent a password reset link to <span className="text-foreground">{email}</span>
            </p>
            <Link to="/login">
              <Button variant="hero-ghost" className="px-8 py-5">
                <ArrowLeft size={16} /> Back to Login
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <h2 className="font-heading font-bold text-2xl text-foreground mb-1">Reset your password</h2>
            <p className="font-body text-sm text-muted-foreground mb-8">
              Enter your email and we'll send you a reset link
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="font-body text-sm text-muted-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 bg-input border-border text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full py-6 text-base"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>

            <p className="font-body text-sm text-muted-foreground text-center mt-6">
              <Link to="/login" className="text-primary hover:underline font-medium flex items-center justify-center gap-1">
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
