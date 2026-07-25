"use client";

import * as React from "react";
import { GlobeIcon, CheckIcon, ChevronDownIcon } from "lucide-react";
import { useLocale, useTranslations } from 'next-intl';

const languages = [
  { code: "en", label: "English", flag: "🇬🇧", dir: "ltr" },
  { code: "fr", label: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "ar", label: "العربية", flag: "🇸🇦", dir: "rtl" },
];

interface LanguageSwitcherProps {
  variant?: 'default' | 'admin';
}

export function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps) {
  const locale = useLocale();
  const t = useTranslations();
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentLocale, setCurrentLocale] = React.useState(locale);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Sync with locale on mount and when locale changes
  React.useEffect(() => {
    setCurrentLocale(locale);
  }, [locale]);

  const currentLang = languages.find((l) => l.code === currentLocale) || languages[0];

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: string, dir: string) => {
    // Set the locale cookie
    document.cookie = `NEXT_LOCALE=${langCode}; path=/; max-age=31536000`; // 1 year
    
    // Update document direction
    document.documentElement.dir = dir;
    document.documentElement.lang = langCode;
    
    // Update local state
    setCurrentLocale(langCode);
    setIsOpen(false);
    
    // Reload the page to apply the new locale
    window.location.reload();
  };

  // Admin variant styling
  if (variant === 'admin') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all w-full cursor-pointer"
        >
          <GlobeIcon className="w-5 h-5" />
          <span className="flex-1 text-left">{t('admin.sidebar.language')}</span>
          <span className="text-xs font-bold uppercase bg-white/20 px-2 py-0.5 rounded">
            {currentLocale}
          </span>
          <ChevronDownIcon 
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} 
          />
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-lg border border-[#E8D5C0] overflow-hidden z-50">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code, language.dir)}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-[#F0E6D6] transition-colors ${
                  currentLocale === language.code ? "bg-[#FFF0F5]" : ""
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span className="text-sm font-medium text-[#2C1810]">{language.label}</span>
                {currentLocale === language.code && (
                  <span className="ml-auto text-[#F4538A]">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default variant styling (customer)
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#F0E6D6] hover:bg-[#FFF0F5] transition-colors cursor-pointer"
        aria-label="Change language"
      >
        <GlobeIcon className="w-4 h-4 text-[#5C3D2E]" />
        <span className="text-sm font-medium text-[#5C3D2E]">
          {currentLang.flag}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-[#E8D5C0] py-2 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code, lang.dir)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                currentLocale === lang.code
                  ? "bg-[#FFF0F5] text-[#F4538A]"
                  : "text-[#5C3D2E] hover:bg-[#FDF6EE]"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span className={lang.code === "ar" ? "font-arabic" : ""}>
                  {lang.label}
                </span>
              </span>
              {currentLocale === lang.code && (
                <CheckIcon className="w-4 h-4" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
