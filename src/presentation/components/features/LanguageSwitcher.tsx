"use client";

import * as React from "react";
import { GlobeIcon, CheckIcon, ChevronDownIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

const languages = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
];

interface LanguageSwitcherProps {
  variant?: "default" | "admin";
}

export function LanguageSwitcher({
  variant = "default",
}: LanguageSwitcherProps) {
  const locale = useLocale();
  const t = useTranslations();
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentLocale, setCurrentLocale] = React.useState(locale);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Sync with locale on mount and when locale changes
  React.useEffect(() => {
    setCurrentLocale(locale);
  }, [locale]);

  const currentLang =
    languages.find((l) => l.code === currentLocale) || languages[0];

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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
  if (variant === "admin") {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all duration-(--duration-base) ease-(--ease-luxury) w-full cursor-pointer"
        >
          <GlobeIcon className="w-5 h-5" />
          <span className="flex-1 text-left">
            {t("admin.sidebar.language")}
          </span>
          <span className="text-xs font-bold uppercase bg-white/20 px-2 py-0.5 rounded">
            {currentLocale}
          </span>
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform duration-(--duration-base) ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-(--color-white) rounded-(--radius-card) shadow-(--shadow-card) border border-(--color-border) overflow-hidden z-50">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() =>
                  handleLanguageChange(language.code, language.dir)
                }
                className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors duration-(--duration-base) ease-(--ease-luxury) cursor-pointer ${
                  currentLocale === language.code
                    ? "bg-(--color-bg-soft)"
                    : "hover:bg-(--color-bg-soft)"
                }`}
              >
                <span className="text-[0.68rem] font-bold uppercase text-(--color-text-secondary) w-6">
                  {language.code}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {language.label}
                </span>
                {currentLocale === language.code && (
                  <span className="ml-auto text-foreground">✓</span>
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
        className="flex items-center gap-2 px-3 py-2 rounded-full border border-(--color-border) bg-(--color-white) hover:border-foreground hover:bg-(--color-bg-soft) transition-colors duration-(--duration-base) ease-(--ease-luxury) cursor-pointer"
        aria-label="Change language"
      >
        <GlobeIcon className="w-4 h-4 text-foreground" />
        <span className="text-xs font-bold uppercase text-foreground">
          {currentLang.code}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-(--color-white) rounded-(--radius-card) shadow-(--shadow-card) border border-(--color-border) py-2 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code, lang.dir)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors duration-(--duration-base) ease-(--ease-luxury) cursor-pointer ${
                currentLocale === lang.code
                  ? "bg-(--color-bg-soft) text-foreground font-semibold"
                  : "text-(--color-text-secondary) hover:bg-(--color-bg-soft) hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-[0.68rem] font-bold uppercase text-(--color-text-secondary) w-6">
                  {lang.code}
                </span>
                <span className={lang.code === "ar" ? "font-arabic" : ""}>
                  {lang.label}
                </span>
              </span>
              {currentLocale === lang.code && <CheckIcon className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
