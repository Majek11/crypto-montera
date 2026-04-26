import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check, ChevronUp } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/i18n";

const LanguageSwitcher = ({ direction = "up" }: { direction?: "up" | "down" }) => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ?? SUPPORTED_LANGUAGES[0];

  const filtered = search
    ? SUPPORTED_LANGUAGES.filter((l) => l.label.toLowerCase().includes(search.toLowerCase()))
    : SUPPORTED_LANGUAGES;

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    
    // Set text direction for RTL languages
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    document.documentElement.dir = (lang && "dir" in lang) ? "rtl" : "ltr";
    
    setOpen(false);
    setSearch("");
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    if (open) {
      document.addEventListener("mousedown", handler);
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body text-muted-foreground hover:text-foreground hover:bg-secondary transition-all w-full"
      >
        <Globe size={18} />
        <span className="flex-1 text-left">{currentLang.flag} {currentLang.label}</span>
        <ChevronUp size={14} className={`transition-transform ${open ? "" : "rotate-180"}`} />
      </button>

      {open && (
        <div className={`absolute ${direction === "up" ? "bottom-full mb-1" : "top-full mt-1"} left-0 w-52 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden`}>
          {/* Search */}
          <div className="p-2 border-b border-border">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search language…"
              className="w-full px-2 py-1.5 text-sm font-body bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          
          {/* Language list */}
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3 font-body">No results</p>
            )}
            
            {filtered.map((lang) => {
              const isActive = i18n.language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleChange(lang.code)}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm font-body transition-colors ${
                    isActive
                      ? "bg-accent-dim text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span className="flex-1 text-left">{lang.label}</span>
                  {isActive && <Check size={14} className="text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;