import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check, ChevronUp } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/i18n";

// Extended language list with Google Translate support
const GOOGLE_TRANSLATE_LANGUAGES = [
  { code: "af", label: "Afrikaans", flag: "🇿🇦" },
  { code: "sq", label: "Albanian", flag: "🇦🇱" },
  { code: "am", label: "Amharic", flag: "🇪🇹" },
  { code: "hy", label: "Armenian", flag: "🇦🇲" },
  { code: "az", label: "Azerbaijani", flag: "🇦🇿" },
  { code: "eu", label: "Basque", flag: "🏴" },
  { code: "be", label: "Belarusian", flag: "🇧🇾" },
  { code: "bn", label: "Bengali", flag: "🇧🇩" },
  { code: "bs", label: "Bosnian", flag: "🇧🇦" },
  { code: "ca", label: "Catalan", flag: "🏴" },
  { code: "ceb", label: "Cebuano", flag: "🇵🇭" },
  { code: "ny", label: "Chichewa", flag: "🇲🇼" },
  { code: "co", label: "Corsican", flag: "🇫🇷" },
  { code: "eo", label: "Esperanto", flag: "🌍" },
  { code: "et", label: "Estonian", flag: "🇪🇪" },
  { code: "tl", label: "Filipino", flag: "🇵🇭" },
  { code: "fy", label: "Frisian", flag: "🇳🇱" },
  { code: "gl", label: "Galician", flag: "🏴" },
  { code: "ka", label: "Georgian", flag: "🇬🇪" },
  { code: "el", label: "Greek", flag: "🇬🇷" },
  { code: "gu", label: "Gujarati", flag: "🇮🇳" },
  { code: "ht", label: "Haitian Creole", flag: "🇭🇹" },
  { code: "ha", label: "Hausa", flag: "🇳🇬" },
  { code: "haw", label: "Hawaiian", flag: "🇺🇸" },
  { code: "iw", label: "Hebrew", flag: "🇮🇱" },
  { code: "hmn", label: "Hmong", flag: "🇱🇦" },
  { code: "is", label: "Icelandic", flag: "🇮🇸" },
  { code: "ig", label: "Igbo", flag: "🇳🇬" },
  { code: "id", label: "Indonesian", flag: "🇮🇩" },
  { code: "ga", label: "Irish", flag: "🇮🇪" },
  { code: "jw", label: "Javanese", flag: "🇮🇩" },
  { code: "kn", label: "Kannada", flag: "🇮🇳" },
  { code: "kk", label: "Kazakh", flag: "🇰🇿" },
  { code: "km", label: "Khmer", flag: "🇰🇭" },
  { code: "ku", label: "Kurdish", flag: "🏴" },
  { code: "ky", label: "Kyrgyz", flag: "🇰🇬" },
  { code: "lo", label: "Lao", flag: "🇱🇦" },
  { code: "la", label: "Latin", flag: "🏛️" },
  { code: "lv", label: "Latvian", flag: "🇱🇻" },
  { code: "lt", label: "Lithuanian", flag: "🇱🇹" },
  { code: "lb", label: "Luxembourgish", flag: "🇱🇺" },
  { code: "mk", label: "Macedonian", flag: "🇲🇰" },
  { code: "mg", label: "Malagasy", flag: "🇲🇬" },
  { code: "ms", label: "Malay", flag: "🇲🇾" },
  { code: "ml", label: "Malayalam", flag: "🇮🇳" },
  { code: "mt", label: "Maltese", flag: "🇲🇹" },
  { code: "mi", label: "Maori", flag: "🇳🇿" },
  { code: "mr", label: "Marathi", flag: "🇮🇳" },
  { code: "mn", label: "Mongolian", flag: "🇲🇳" },
  { code: "my", label: "Myanmar", flag: "🇲🇲" },
  { code: "ne", label: "Nepali", flag: "🇳🇵" },
  { code: "ps", label: "Pashto", flag: "🇦🇫" },
  { code: "fa", label: "Persian", flag: "🇮🇷" },
  { code: "pa", label: "Punjabi", flag: "🇮🇳" },
  { code: "ro", label: "Romanian", flag: "🇷🇴" },
  { code: "sm", label: "Samoan", flag: "🇼🇸" },
  { code: "gd", label: "Scots Gaelic", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { code: "sr", label: "Serbian", flag: "🇷🇸" },
  { code: "st", label: "Sesotho", flag: "🇱🇸" },
  { code: "sn", label: "Shona", flag: "🇿🇼" },
  { code: "sd", label: "Sindhi", flag: "🇵🇰" },
  { code: "si", label: "Sinhala", flag: "🇱🇰" },
  { code: "sk", label: "Slovak", flag: "🇸🇰" },
  { code: "sl", label: "Slovenian", flag: "🇸🇮" },
  { code: "so", label: "Somali", flag: "🇸🇴" },
  { code: "su", label: "Sundanese", flag: "🇮🇩" },
  { code: "sw", label: "Swahili", flag: "🇰🇪" },
  { code: "sv", label: "Swedish", flag: "🇸🇪" },
  { code: "tg", label: "Tajik", flag: "🇹🇯" },
  { code: "ta", label: "Tamil", flag: "🇮🇳" },
  { code: "te", label: "Telugu", flag: "🇮🇳" },
  { code: "th", label: "Thai", flag: "🇹🇭" },
  { code: "uk", label: "Ukrainian", flag: "🇺🇦" },
  { code: "ur", label: "Urdu", flag: "🇵🇰" },
  { code: "uz", label: "Uzbek", flag: "🇺🇿" },
  { code: "vi", label: "Vietnamese", flag: "🇻🇳" },
  { code: "cy", label: "Welsh", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  { code: "xh", label: "Xhosa", flag: "🇿🇦" },
  { code: "yi", label: "Yiddish", flag: "🕍" },
  { code: "yo", label: "Yoruba", flag: "🇳🇬" },
  { code: "zu", label: "Zulu", flag: "🇿🇦" },
];

// Combine all languages
const ALL_LANGUAGES = [
  ...SUPPORTED_LANGUAGES.map(lang => ({ ...lang, isManual: true })),
  ...GOOGLE_TRANSLATE_LANGUAGES.map(lang => ({ ...lang, isGoogleTranslate: true }))
];

declare global {
  interface Window {
    translatePage: (langCode: string) => boolean;
    resetTranslation: () => boolean;
  }
}

const LanguageSwitcher = ({ direction = "up" }: { direction?: "up" | "down" }) => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currentGoogleLang, setCurrentGoogleLang] = useState<string | null>(null);
  const [googleTranslateReady, setGoogleTranslateReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Get current active language
  const getCurrentLang = () => {
    if (currentGoogleLang) {
      return ALL_LANGUAGES.find(l => l.code === currentGoogleLang && l.isGoogleTranslate) || ALL_LANGUAGES[0];
    }
    return ALL_LANGUAGES.find(l => l.code === i18n.language && l.isManual) || ALL_LANGUAGES[0];
  };

  const currentLang = getCurrentLang();

  const filtered = search
    ? ALL_LANGUAGES.filter((l) => l.label.toLowerCase().includes(search.toLowerCase()))
    : ALL_LANGUAGES;

  // Listen for Google Translate ready event
  useEffect(() => {
    const handleGoogleTranslateReady = () => {
      setGoogleTranslateReady(true);
      console.log('Google Translate is ready');
    };

    window.addEventListener('googleTranslateReady', handleGoogleTranslateReady);
    
    // Check if already ready
    if (window.translatePage) {
      setGoogleTranslateReady(true);
    }

    return () => {
      window.removeEventListener('googleTranslateReady', handleGoogleTranslateReady);
    };
  }, []);

  // Monitor Google Translate changes
  useEffect(() => {
    if (!googleTranslateReady) return;

    const checkGoogleTranslateState = () => {
      const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (selectElement) {
        const currentValue = selectElement.value;
        if (currentValue && currentValue !== currentGoogleLang) {
          setCurrentGoogleLang(currentValue);
        } else if (!currentValue && currentGoogleLang) {
          setCurrentGoogleLang(null);
        }
      }
    };

    // Check immediately
    checkGoogleTranslateState();

    // Set up periodic checking
    const interval = setInterval(checkGoogleTranslateState, 1000);

    return () => clearInterval(interval);
  }, [googleTranslateReady, currentGoogleLang]);

  const handleManualLanguageChange = (code: string) => {
    // Reset Google Translate first
    if (currentGoogleLang && window.resetTranslation) {
      window.resetTranslation();
      setCurrentGoogleLang(null);
    }
    
    // Change manual language
    i18n.changeLanguage(code);
    
    // Set text direction
    const lang = ALL_LANGUAGES.find(l => l.code === code);
    document.documentElement.dir = (lang && "dir" in lang) ? "rtl" : "ltr";
  };

  const handleGoogleTranslateChange = (code: string) => {
    if (!googleTranslateReady || !window.translatePage) {
      console.warn('Google Translate not ready yet');
      return;
    }

    // Reset manual language to English first
    if (i18n.language !== 'en') {
      i18n.changeLanguage('en');
    }

    // Trigger Google Translate
    const success = window.translatePage(code);
    if (success) {
      setCurrentGoogleLang(code);
      
      // Set text direction
      const lang = ALL_LANGUAGES.find(l => l.code === code);
      document.documentElement.dir = (lang && "dir" in lang) ? "rtl" : "ltr";
    } else {
      console.warn('Failed to trigger Google Translate for:', code);
    }
  };

  const handleLanguageChange = (code: string, isGoogleTranslate: boolean) => {
    if (isGoogleTranslate) {
      handleGoogleTranslateChange(code);
    } else {
      handleManualLanguageChange(code);
    }
    
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
            
            {/* Manual translations first */}
            {filtered.filter(lang => lang.isManual).map((lang) => {
              const isActive = i18n.language === lang.code && !currentGoogleLang;
              return (
                <button
                  key={`manual-${lang.code}`}
                  onClick={() => handleLanguageChange(lang.code, false)}
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
            {filtered.some(l => l.isManual) && filtered.some(l => l.isGoogleTranslate) && (
              <div className="border-t border-border my-1">
                <p className="text-xs text-muted-foreground px-3 py-1 font-body">
                  More Languages (Google Translate)
                  {!googleTranslateReady && <span className="ml-1 text-amber-400">⏳</span>}
                </p>
              </div>
            )}
            
            {/* Google Translate languages */}
            {filtered.filter(lang => lang.isGoogleTranslate).map((lang) => {
              const isActive = currentGoogleLang === lang.code;
              return (
                <button
                  key={`gt-${lang.code}`}
                  onClick={() => handleLanguageChange(lang.code, true)}
                  disabled={!googleTranslateReady}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm font-body transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isActive
                      ? "bg-accent-dim text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span className="flex-1 text-left">{lang.label}</span>
                  <span className="text-xs text-muted-foreground">GT</span>
                  {isActive && <Check size={14} className="text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Hidden Google Translate Element */}
      <div id="google_translate_element" className="hidden"></div>
    </div>
  );
};

export default LanguageSwitcher;
