export const locales = ['en', 'fr', 'ar'] as const;
export const defaultLocale = 'fr' as const;

export const i18nConfig = {
  locales,
  defaultLocale,
  timeZone: 'Africa/Algiers',
};

export type Locale = (typeof locales)[number];
