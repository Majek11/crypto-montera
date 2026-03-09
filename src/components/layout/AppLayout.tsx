import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import {
  LayoutDashboard,
  TrendingUp,
  History,
  Settings,
  LogOut,
  Wallet,
  ChevronRight,
  ShieldCheck,
  FileCheck,
  Activity,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import NotificationBell from "@/components/notifications/NotificationBell";
import CommandPalette from "@/components/CommandPalette";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { supabase } from "@/integrations/supabase/client";

const navKeys = [
  { labelKey: "nav.dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { labelKey: "nav.investmentPlans", icon: TrendingUp, path: "/plans" },
  { labelKey: "nav.transactions", icon: History, path: "/transactions" },
  { labelKey: "nav.wallets", icon: Wallet, path: "/wallets" },
  { labelKey: "nav.kycVerification", icon: FileCheck, path: "/kyc" },
  { labelKey: "nav.activityLog", icon: Activity, path: "/activity" },
  { labelKey: "nav.settings", icon: Settings, path: "/settings" },
];

// Items shown in mobile bottom nav (up to 5 — rest are accessible via Cmd+K)
const mobileNavKeys = navKeys.slice(0, 5);

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Fetch avatar
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("avatar_url").eq("user_id", user.id).single().then(({ data }) => {
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    });
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success(t("common.signedOut"));
    navigate("/");
  };

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-background flex">
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-surface p-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-6 px-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">◈</span>
          </div>
          <span className="font-heading font-bold text-lg text-foreground">Monetra</span>
        </Link>

        {/* Cmd+K trigger */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all text-sm font-body w-full"
        >
          <Search size={14} />
          <span className="flex-1 text-left">{t("common.search")}</span>
          <span className="font-mono text-[10px] border border-border rounded px-1.5 py-0.5 hidden xl:inline">⌘K</span>
        </button>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {navKeys.map((item) => {
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
                {t(item.labelKey)}
                {isActive && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center gap-3 px-3 mb-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-primary font-heading font-bold text-sm">
                  {displayName[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm text-foreground font-medium truncate">{displayName}</p>
              <p className="font-mono text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <NotificationBell />
          </div>
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body text-amber-400 hover:bg-amber-400/10 transition-all w-full mb-1"
            >
              <ShieldCheck size={18} />
              {t("nav.adminPanel")}
            </Link>
          )}
          <LanguageSwitcher />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all w-full"
          >
            <LogOut size={18} />
            {t("common.signOut")}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">◈</span>
          </div>
          <span className="font-heading font-bold text-foreground">Monetra</span>
        </Link>
        <div className="flex items-center gap-2">
          {/* Cmd+K button on mobile */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title={t("common.search")}
          >
            <Search size={18} />
          </button>
          <NotificationBell />
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-heading font-bold text-xs">
                {displayName[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Nav — shows 5 items */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border flex justify-around py-2">
        {mobileNavKeys.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-1 ${isActive ? "text-primary" : "text-muted-foreground"
                }`}
            >
              <item.icon size={18} />
              <span className="text-[10px] font-body">{t(item.labelKey).split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-14 pb-20 lg:pt-0 lg:pb-0">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
