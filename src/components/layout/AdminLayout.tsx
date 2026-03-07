import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  BarChart3,
  Briefcase,
  LogOut,
  ArrowLeft,
  ChevronRight,
  CreditCard,
  Gift,
} from "lucide-react";
import { toast } from "sonner";

const adminNav = [
  { label: "Overview", icon: LayoutDashboard, path: "/admin" },
  { label: "Users", icon: Users, path: "/admin/users" },
  { label: "Transactions", icon: CreditCard, path: "/admin/transactions" },
  { label: "KYC Review", icon: ShieldCheck, path: "/admin/kyc" },
  { label: "Bonuses", icon: Gift, path: "/admin/bonus" },
  { label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  { label: "Plans", icon: Briefcase, path: "/admin/plans" },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-surface p-4">
        <Link to="/" className="flex items-center gap-2 mb-2 px-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">◈</span>
          </div>
          <span className="font-heading font-bold text-lg text-foreground">Monetra</span>
        </Link>
        <span className="px-3 font-mono text-[10px] text-destructive mb-6">ADMIN PANEL</span>

        <nav className="flex-1 space-y-1">
          {adminNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-all ${isActive
                    ? "bg-accent-dim text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
              >
                <item.icon size={18} />
                {item.label}
                {isActive && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-4 mt-4 space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <ArrowLeft size={18} />
            Back to App
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all w-full"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">◈</span>
          </div>
          <span className="font-heading font-bold text-foreground">Admin</span>
        </div>
        <Link to="/dashboard" className="font-body text-xs text-primary">← Back</Link>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border flex justify-around py-2">
        {adminNav.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-2 py-1 ${isActive ? "text-primary" : "text-muted-foreground"}`}
            >
              <item.icon size={18} />
              <span className="text-[10px] font-body">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <main className="flex-1 overflow-y-auto pt-14 pb-20 lg:pt-0 lg:pb-0">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
