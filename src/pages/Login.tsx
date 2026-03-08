import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowUpRight } from "lucide-react";
import { z } from "zod";
import SEO from "@/components/SEO";

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isConfirmed = new URLSearchParams(location.search).get("confirmed") === "true";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      // Check profile status and roles
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const [{ data: profile }, { data: roles }] = await Promise.all([
          supabase.from("profiles").select("status").eq("user_id", authUser.id).single(),
          supabase.from("user_roles").select("role").eq("user_id", authUser.id),
        ]);

        // Block suspended/banned users
        if (profile?.status === "suspended" || profile?.status === "banned") {
          await supabase.auth.signOut();
          toast.error(`Your account has been ${profile.status}. Please contact support.`);
          return;
        }

        toast.success("Welcome back!");
        const isAdmin = roles?.some((r) => r.role === "admin");
        navigate(isAdmin ? "/admin" : "/dashboard");
      } else {
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <SEO title="Sign In" description="Sign in to your Monetra account to access your crypto portfolio, investments, and wallet." noIndex />
      {/* Left - Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(circle at 30% 50%, hsla(130,100%,65%,0.06), transparent 60%)" }}
        />
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">◈</span>
          </div>
          <span className="font-heading font-bold text-xl text-foreground">Monetra</span>
        </div>
        <div className="relative z-10">
          <h1 className="font-display text-6xl text-foreground leading-[0.9] mb-4">
            INVEST WITH<br />CONFIDENCE
          </h1>
          <p className="font-body text-muted-foreground max-w-sm">
            Managed investment plans built for speed, clarity, and control.
          </p>
        </div>
        <p className="font-mono text-xs text-muted-foreground relative z-10">© 2026 Monetra</p>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">◈</span>
            </div>
            <span className="font-heading font-bold text-lg text-foreground">Monetra</span>
          </div>

          <h2 className="font-heading font-bold text-2xl text-foreground mb-1">Welcome back</h2>
          <p className="font-body text-sm text-muted-foreground mb-8">
            Sign in to your account to continue
          </p>

          {/* ── Email confirmed banner ── */}
          {isConfirmed && (
            <div className="mb-6 flex items-start gap-3 bg-primary/10 border border-primary/30 rounded-lg px-4 py-3">
              <span className="text-primary text-lg mt-0.5">✓</span>
              <div>
                <p className="font-body text-sm font-semibold text-primary">Email confirmed!</p>
                <p className="font-body text-xs text-muted-foreground mt-0.5">Your account is verified. Sign in below to access your dashboard.</p>
              </div>
            </div>
          )}

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

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-body text-sm text-muted-foreground">Password</Label>
                <Link to="/forgot-password" className="font-body text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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
                <>Sign In <ArrowUpRight size={16} /></>
              )}
            </Button>
          </form>

          <p className="font-body text-sm text-muted-foreground text-center mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
