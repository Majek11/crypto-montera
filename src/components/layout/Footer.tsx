import { Link } from "react-router-dom";

const footerLinks = {
  Product: [
    { label: "Investment Plans", href: "/#plans" },
    { label: "Features", href: "/" },
    { label: "Security", href: "/" },
    { label: "Pricing", href: "/#plans" },
  ],
  Company: [
    { label: "About Us", href: "/#about" },
    { label: "Careers", href: "/" },
    { label: "Press", href: "/" },
    { label: "Contact", href: "/" },
  ],
  Resources: [
    { label: "Documentation", href: "/" },
    { label: "FAQ", href: "/#faq" },
    { label: "Blog", href: "/" },
    { label: "Community", href: "/" },
  ],
  Legal: [
    { label: "Terms of Service", href: "/" },
    { label: "Privacy Policy", href: "/" },
    { label: "Cookie Policy", href: "/" },
    { label: "Compliance", href: "/" },
  ],
};

const socialLinks = [
  { label: "Twitter", icon: "𝕏" },
  { label: "Discord", icon: "◆" },
  { label: "Telegram", icon: "✈" },
  { label: "GitHub", icon: "⌘" },
];

const Footer = () => {
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
              The next generation of crypto investment. Zero fees, instant settlement, bank-grade security.
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
            © 2026 Monetra. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-muted-foreground">
              Built with trust & transparency
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              <span className="font-mono text-[11px] text-primary">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
