import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check, ChevronUp } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/i18n";

// Extended language list with Google Translate support
const ALL_LANGUAGES = [
  // Keep existing manual translations first (higher quality)
  ...SUPPORTED_LANGUAGES,
  
  // Add Google Translate supported languages
  { code: "af", label: "Afrikaans", flag: "🇿🇦", googleTranslate: true },
  { code: "sq", label: "Albanian", flag: "🇦🇱", googleTranslate: true },
  { code: "am", label: "Amharic", flag: "🇪🇹", googleTranslate: true },
  { code: "hy", label: "Armenian", flag: "🇦🇲", googleTranslate: true },
  { code: "az", label: "Azerbaijani", flag: "🇦🇿", googleTranslate: true },
  { code: "eu", label: "Basque", flag: "🏴", googleTranslate: true },
  { code: "be", label: "Belarusian", flag: "🇧🇾", googleTranslate: true },
  { code: "bn", label: "Bengali", flag: "🇧🇩", googleTranslate: true },
  { code: "bs", label: "Bosnian", flag: "🇧🇦", googleTranslate: true },
  { code: "bg", label: "Bulgarian", flag: "🇧🇬", googleTranslate: true },
  { code: "ca", label: "Catalan", flag: "🏴", googleTranslate: true },
  { code: "ceb", label: "Cebuano", flag: "🇵🇭", googleTranslate: true },
  { code: "ny", label: "Chichewa", flag: "🇲🇼", googleTranslate: true },
  { code: "co", label: "Corsican", flag: "🇫🇷", googleTranslate: true },
  { code: "hr", label: "Croatian", flag: "🇭🇷", googleTranslate: true },
  { code: "cs", label: "Czech", flag: "🇨🇿", googleTranslate: true },
  { code: "da", label: "Danish", flag: "🇩🇰", googleTranslate: true },
  { code: "et", label: "Estonian", flag: "🇪🇪", googleTranslate: true },
  { code: "tl", label: "Filipino", flag: "🇵🇭", googleTranslate: true },
  { code: "fi", label: "Finnish", flag: "🇫🇮", googleTranslate: true },
  { code: "fy", label: "Frisian", flag: "🇳🇱", googleTranslate: true },
  { code: "gl", label: "Galician", flag: "🏴", googleTranslate: true },
  { code: "ka", label: "Georgian", flag: "🇬🇪", googleTranslate: true },
  { code: "el", label: "Greek", flag: "🇬🇷", googleTranslate: true },
  { code: "gu", label: "Gujarati", flag: "🇮🇳", googleTranslate: true },
  { code: "ht", label: "Haitian Creole", flag: "🇭🇹", googleTranslate: true },
  { code: "ha", label: "Hausa", flag: "🇳🇬", googleTranslate: true },
  { code: "haw", label: "Hawaiian", flag: "🇺🇸", googleTranslate: true },
  { code: "iw", label: "Hebrew", flag: "🇮🇱", googleTranslate: true },
  { code: "hmn", label: "Hmong", flag: "🇱🇦", googleTranslate: true },
  { code: "hu", label: "Hungarian", flag: "🇭🇺", googleTranslate: true },
  { code: "is", label: "Icelandic", flag: "🇮🇸", googleTranslate: true },
  { code: "ig", label: "Igbo", flag: "🇳🇬", googleTranslate: true },
  { code: "id", label: "Indonesian", flag: "🇮🇩", googleTranslate: true },
  { code: "ga", label: "Irish", flag: "🇮🇪", googleTranslate: true },
  { code: "jw", label: "Javanese", flag: "🇮🇩", googleTranslate: true },
  { code: "kn", label: "Kannada", flag: "🇮🇳", googleTranslate: true },
  { code: "kk", label: "Kazakh", flag: "🇰🇿", googleTranslate: true },
  { code: "km", label: "Khmer", flag: "🇰🇭", googleTranslate: true },
  { code: "ky", label: "Kyrgyz", flag: "🇰🇬", googleTranslate: true },
  { code: "lo", label: "Lao", flag: "🇱🇦", googleTranslate: true },
  { code: "la", label: "Latin", flag: "🏛️", googleTranslate: true },
  { code: "lv", label: "Latvian", flag: "🇱🇻", googleTranslate: true },
  { code: "lt", label: "Lithuanian", flag: "🇱🇹", googleTranslate: true },
  { code: "lb", label: "Luxembourgish", flag: "🇱🇺", googleTranslate: true },
  { code: "mk", label: "Macedonian", flag: "🇲🇰", googleTranslate: true },
  { code: "mg", label: "Malagasy", flag: "🇲🇬", googleTranslate: true },
  { code: "ms", label: "Malay", flag: "🇲🇾", googleTranslate: true },
  { code: "ml", label: "Malayalam", flag: "🇮🇳", googleTranslate: true },
  { code: "mt", label: "Maltese", flag: "🇲🇹", googleTranslate: true },
  { code: "mi", label: "Maori", flag: "🇳🇿", googleTranslate: true },
  { code: "mr", label: "Marathi", flag: "🇮🇳", googleTranslate: true },
  { code: "mn", label: "Mongolian", flag: "🇲🇳", googleTranslate: true },
  { code: "my", label: "Myanmar", flag: "🇲🇲", googleTranslate: true },
  { code: "ne", label: "Nepali", flag: "🇳🇵", googleTranslate: true },
  { code: "no", label: "Norwegian", flag: "🇳🇴", googleTranslate: true },
  { code: "ps", label: "Pashto", flag: "🇦🇫", googleTranslate: true },
  { code: "fa", label: "Persian", flag: "🇮🇷", googleTranslate: true },
  { code: "pa", label: "Punjabi", flag: "🇮🇳", googleTranslate: true },
  { code: "ro", label: "Romanian", flag: "🇷🇴", googleTranslate: true },
  { code: "sm", label: "Samoan", flag: "🇼🇸", googleTranslate: true },
  { code: "gd", label: "Scots Gaelic", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", googleTranslate: true },
  { code: "sr", label: "Serbian", flag: "🇷🇸", googleTranslate: true },
  { code: "st", label: "Sesotho", flag: "🇱🇸", googleTranslate: true },
  { code: "sn", label: "Shona", flag: "🇿🇼", googleTranslate: true },
  { code: "sd", label: "Sindhi", flag: "🇵🇰", googleTranslate: true },
  { code: "si", label: "Sinhala", flag: "🇱🇰", googleTranslate: true },
  { code: "sk", label: "Slovak", flag: "🇸🇰", googleTranslate: true },
  { code: "sl", label: "Slovenian", flag: "🇸🇮", googleTranslate: true },
  { code: "so", label: "Somali", flag: "🇸🇴", googleTranslate: true },
  { code: "su", label: "Sundanese", flag: "🇮🇩", googleTranslate: true },
  { code: "sw", label: "Swahili", flag: "🇰🇪", googleTranslate: true },
  { code: "sv", label: "Swedish", flag: "🇸🇪", googleTranslate: true },
  { code: "tg", label: "Tajik", flag: "🇹🇯", googleTranslate: true },
  { code: "ta", label: "Tamil", flag: "🇮🇳", googleTranslate: true },
  { code: "te", label: "Telugu", flag: "🇮🇳", googleTranslate: true },
  { code: "th", label: "Thai", flag: "🇹🇭", googleTranslate: true },
  { code: "uk", label: "Ukrainian", flag: "🇺🇦", googleTranslate: true },
  { code: "ur", label: "Urdu", flag: "🇵🇰", googleTranslate: true },
  { code: "uz", label: "Uzbek", flag: "🇺🇿", googleTranslate: true },
  { code: "vi", label: "Vietnamese", flag: "🇻🇳", googleTranslate: true },
  { code: "cy", label: "Welsh", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", googleTranslate: true },
  { code: "xh", label: "Xhosa", flag: "🇿🇦", googleTranslate: true },
  { code: "yi", label: "Yiddish", flag: "🕍", googleTranslate: true },
  { code: "yo", label: "Yoruba", flag: "🇳🇬", googleTranslate: true },
  { code: "zu", label: "Zulu", flag: "🇿🇦", googleTranslate: true },
];

const LanguageSwitcher = ({ direction = "up" }: { direction?: "up" | "down" }) => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const currentLang = ALL_LANGUAGES.find((l) => l.code === i18n.language) ?? ALL_LANGUAGES[0];

  const filtered = search
    ? ALL_LANGUAGES.filter((l) => l.label.toLowerCase().includes(search.toLowerCase()))
    : ALL_LANGUAGES;

  const handleChange = (code: string, isGoogleTranslate = false) => {
    const lang = ALL_LANGUAGES.find((l) => l.code === code);
    
    if (isGoogleTranslate) {
      // Use Google Translate
      const googleTranslateCombo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (googleTranslateCombo) {
        googleTranslateCombo.value = code;
        googleTranslateCombo.dispatchEvent(new Event('change'));
      }
    } else {
      // Use manual translation
      i18n.changeLanguage(code);
    }
    
    document.documentElement.dir = lang && "dir" in lang ? "rtl" : "ltr";
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
      // Focus search when opened
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
            
            {/* Manual translations first */}
            {filtered.filter(lang => !lang.googleTranslate).map((lang) => {
              const isActive = i18n.language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleChange(lang.code, false)}
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
            
            {/* Separator if both types exist */}
            {filtered.some(l => !l.googleTranslate) && filtered.some(l => l.googleTranslate) && (
              <div className="border-t border-border my-1">
                <p className="text-xs text-muted-foreground px-3 py-1 font-body">More Languages (Google Translate)</p>
              </div>
            )}
            
            {/* Google Translate languages */}
            {filtered.filter(lang => lang.googleTranslate).map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleChange(lang.code, true)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm font-body text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <span>{lang.flag}</span>
                <span className="flex-1 text-left">{lang.label}</span>
                <span className="text-xs text-muted-foreground">GT</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Hidden Google Translate Element */}
      <div id="google_translate_element" className="hidden"></div>
    </div>
  );
};

export default LanguageSwitcher;
