'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Locales, type AppLocale } from '@/i18n/routing';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const LocaleLabels: Record<AppLocale, string> = {
  nl: 'NL',
  en: 'EN',
  fr: 'FR',
  de: 'DE',
};

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('localeSwitcher');

  return (
    <Select
      value={locale}
      onValueChange={(nextLocale) => {
        router.replace(pathname, { locale: nextLocale as AppLocale });
        router.refresh();
      }}
    >
      <SelectTrigger className="h-8 w-[5.5rem] rounded-full" aria-label={t('label')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent variant="borderless">
        {Locales.map((item) => (
          <SelectItem key={item} value={item}>
            {LocaleLabels[item]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
