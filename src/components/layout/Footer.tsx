import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const socialLinks = [
  { label: "Twitter", icon: "𝕏" },
  { label: "Discord", icon: "◆" },
  { label: "Telegram", icon: "✈" },
  { label: "GitHub", icon: "⌘" },
];

const Footer = () => {
  const { t } = useTranslation();

  const footerLinks = {
    [t("footer.product")]: [
      { label: t("footer.investmentPlans"), href: "/#plans" },
      { label: t("footer.featuresLink"), href: "/" },
      { label: t("footer.security"), href: "/" },
      { label: t("footer.pricing"), href: "/#plans" },
    ],
    [t("footer.company")]: [
      { label: t("footer.aboutUs"), href: "/#about" },
      { label: t("footer.careers"), href: "/" },
      { label: t("footer.press"), href: "/" },
      { label: t("footer.contact"), href: "/" },
    ],
    [t("footer.resources")]: [
      { label: t("footer.documentation"), href: "/" },
      { label: t("footer.faqLink"), href: "/#faq" },
      { label: t("footer.blog"), href: "/" },
      { label: t("footer.community"), href: "/" },
    ],
    [t("footer.legal")]: [
      { label: t("footer.terms"), href: "/" },
      { label: t("footer.privacy"), href: "/" },
      { label: t("footer.cookies"), href: "/" },
      { label: t("footer.compliance"), href: "/" },
    ],
  };

  return (
    <footer className="bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        {/* Top section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">◈</span>
              </div>
              <span className="font-heading font-bold text-lg text-foreground">Monetra</span>
            </Link>
            <p className="font-body text-xs text-muted-foreground leading-relaxed mb-6">
              {t("footer.tagline")}
            </p>
            <div className="flex gap-3">
              {socialLinks.map((s) => (
                <button
                  key={s.label}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border-light transition-all text-xs"
                  aria-label={s.label}
                >
                  {s.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-heading font-bold text-xs text-foreground mb-4 uppercase tracking-wider">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[11px] text-muted-foreground">
            {t("footer.copyright")}
          </p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-muted-foreground">
              {t("footer.builtWith")}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              <span className="font-mono text-[11px] text-primary">{t("footer.operational")}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
