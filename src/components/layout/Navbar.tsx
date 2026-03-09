import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ArrowUpRight, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

const navKeys = [
  { labelKey: "common.home", href: "/" },
  { labelKey: "common.about", href: "/#about" },
  { labelKey: "common.plans", href: "/#plans" },
  { labelKey: "common.faq", href: "/#faq" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith("/#")) {
      const id = href.replace("/#", "");
      if (location.pathname === "/") {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = href;
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-xl border-b border-border">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">◈</span>
        </div>
        <span className="font-heading font-bold text-lg text-foreground">Monetra</span>
      </Link>

      {/* Desktop Nav Links */}
      <div className="hidden md:flex items-center bg-secondary/60 rounded-pill px-1 py-1 border border-border">
        {navKeys.map((link) => (
          <Link
            key={link.labelKey}
            to={link.href}
            onClick={() => handleNavClick(link.href)}
            className={`px-4 py-1.5 rounded-pill text-sm font-body font-medium transition-all ${
              location.pathname === link.href
                ? "bg-accent-dim text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(link.labelKey)}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:block">
          <LanguageSwitcher direction="down" />
        </div>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {user ? (
          <Link to="/dashboard">
            <Button variant="wallet" size="default" className="hidden sm:flex items-center gap-2">
              {t("common.dashboard")} <ArrowUpRight size={14} />
            </Button>
          </Link>
        ) : (
          <>
            <Link to="/login">
              <Button variant="ghost" size="default" className="hidden sm:flex text-muted-foreground hover:text-foreground">
                {t("common.signIn")}
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="wallet" size="default" className="hidden sm:flex items-center gap-2">
                {t("common.getStarted")} <ArrowUpRight size={14} />
              </Button>
            </Link>
          </>
        )}
        <button
          className="md:hidden w-10 h-10 rounded-lg border border-border flex items-center justify-center text-muted-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-background border-b border-border p-6 md:hidden">
          <div className="flex flex-col gap-4">
            {navKeys.map((link) => (
              <Link
                key={link.labelKey}
                to={link.href}
                onClick={() => handleNavClick(link.href)}
                className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t(link.labelKey)}
              </Link>
            ))}
            <div className="pt-2">
              <LanguageSwitcher direction="down" />
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              {user ? (
                <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button variant="wallet" className="w-full">{t("common.dashboard")}</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="hero-ghost" className="w-full">{t("common.signIn")}</Button>
                  </Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)}>
                    <Button variant="wallet" className="w-full">{t("common.getStarted")}</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
