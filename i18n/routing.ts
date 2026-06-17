import { defineRouting } from 'next-intl/routing';

export const Locales = ['nl', 'en', 'fr', 'de'] as const;
export type AppLocale = (typeof Locales)[number];

export const routing = defineRouting({
  locales: [...Locales],
  defaultLocale: 'nl',
  localePrefix: 'never',
});

export const AppTimeZone = 'Europe/Amsterdam';
