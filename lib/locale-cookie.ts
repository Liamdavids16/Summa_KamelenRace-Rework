import type { AppLocale } from '@/i18n/routing';

const LocaleCookieName = 'NEXT_LOCALE';
const LocaleCookieMaxAge = 60 * 60 * 24 * 365;

export function setLocaleCookie(locale: AppLocale): void {
  document.cookie = `${LocaleCookieName}=${locale}; path=/; max-age=${LocaleCookieMaxAge}; SameSite=Lax`;
}
