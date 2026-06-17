import type { AppLocale } from '@/i18n/routing';

const LocaleCountryCodes: Record<AppLocale, string> = {
  nl: 'nl',
  en: 'us',
  fr: 'fr',
  de: 'de',
};

export const LocaleLabels: Record<AppLocale, string> = {
  nl: 'NL',
  en: 'EN',
  fr: 'FR',
  de: 'DE',
};

export function GetLocaleCountryCode(locale: AppLocale): string {
  return LocaleCountryCodes[locale];
}

export function GetLocaleFlagUrl(countryCode: string): string {
  return `https://flagcdn.com/${countryCode}.svg`;
}
