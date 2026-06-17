import type { AppLocale } from '@/i18n/routing';
import { GetLocaleCountryCode, GetLocaleFlagUrl, LocaleLabels } from '@/lib/locale-flags';
import { cn } from '@/lib/utils';

type LocaleFlagProps = {
  locale: AppLocale;
  className?: string;
};

export function LocaleFlag({ locale, className }: LocaleFlagProps) {
  const countryCode = GetLocaleCountryCode(locale);

  return (
    <img
      src={GetLocaleFlagUrl(countryCode)}
      width={24}
      height={16}
      alt=""
      aria-hidden
      className={cn('shrink-0 rounded-[2px] object-cover', className)}
    />
  );
}

type LocaleOptionProps = {
  locale: AppLocale;
};

export function LocaleOption({ locale }: LocaleOptionProps) {
  return (
    <span className="flex items-center gap-2">
      <LocaleFlag locale={locale} />
      {LocaleLabels[locale]}
    </span>
  );
}
