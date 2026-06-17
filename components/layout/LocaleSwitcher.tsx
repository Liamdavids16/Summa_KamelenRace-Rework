'use client';

import { useEffect, useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Locales, type AppLocale } from '@/i18n/routing';
import { LocaleChangeEvent } from '@/components/layout/ClientIntlProvider';
import { LocaleOption } from '@/components/layout/LocaleFlag';
import { setLocaleCookie } from '@/lib/locale-cookie';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function IsActiveRoomPath(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.includes('/room/');
}

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('localeSwitcher');
  const [, startTransition] = useTransition();
  const [pendingLocale, setPendingLocale] = useState<AppLocale | null>(null);

  useEffect(() => {
    setPendingLocale(null);
  }, [locale]);

  const displayedLocale = pendingLocale ?? locale;

  return (
    <Select
      value={displayedLocale}
      onValueChange={(nextLocale) => {
        const targetLocale = nextLocale as AppLocale;
        if (IsActiveRoomPath() || pathname.startsWith('/room/')) {
          setPendingLocale(targetLocale);
          setLocaleCookie(targetLocale);
          window.dispatchEvent(new CustomEvent(LocaleChangeEvent, { detail: targetLocale }));
          return;
        }
        startTransition(() => {
          router.replace(pathname, { locale: targetLocale });
          window.dispatchEvent(new CustomEvent(LocaleChangeEvent, { detail: targetLocale }));
        });
      }}
    >
      <SelectTrigger className="h-8 w-[6.75rem] gap-2 rounded-full" aria-label={t('label')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent variant="borderless">
        {Locales.map((item) => (
          <SelectItem key={item} value={item}>
            <LocaleOption locale={item} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
