'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { useLocale } from 'next-intl';
import { AppTimeZone, type AppLocale } from '@/i18n/routing';

export const LocaleChangeEvent = 'kamelenrace:locale-change';

interface ClientIntlProviderProps {
  children: ReactNode;
  locale: AppLocale;
  initialMessages: AbstractIntlMessages;
}

interface IntlBundle {
  locale: AppLocale;
  messages: AbstractIntlMessages;
}

function IntlLocaleSync({ onBundleChange }: { onBundleChange: (bundle: IntlBundle) => void }) {
  const locale = useLocale() as AppLocale;
  const prevLocale = useRef(locale);

  const loadBundle = useCallback(
    (nextLocale: AppLocale) => {
      import(`@/i18n/messages/${nextLocale}.json`)
        .then((module) => onBundleChange({ locale: nextLocale, messages: module.default }))
        .catch(() => {});
    },
    [onBundleChange]
  );

  useEffect(() => {
    if (locale === prevLocale.current) return;
    prevLocale.current = locale;
    loadBundle(locale);
  }, [locale, loadBundle]);

  useEffect(() => {
    const handleLocaleChange = (event: Event) => {
      const nextLocale = (event as CustomEvent<AppLocale>).detail;
      if (!nextLocale || nextLocale === prevLocale.current) return;
      prevLocale.current = nextLocale;
      loadBundle(nextLocale);
    };

    window.addEventListener(LocaleChangeEvent, handleLocaleChange);
    return () => window.removeEventListener(LocaleChangeEvent, handleLocaleChange);
  }, [loadBundle]);

  return null;
}

export function ClientIntlProvider({ locale, initialMessages, children }: ClientIntlProviderProps) {
  const [bundle, setBundle] = useState<IntlBundle>({ locale, messages: initialMessages });

  useEffect(() => {
    setBundle({ locale, messages: initialMessages });
  }, [locale, initialMessages]);

  return (
    <NextIntlClientProvider locale={bundle.locale} messages={bundle.messages} timeZone={AppTimeZone}>
      <IntlLocaleSync onBundleChange={setBundle} />
      {children}
    </NextIntlClientProvider>
  );
}
