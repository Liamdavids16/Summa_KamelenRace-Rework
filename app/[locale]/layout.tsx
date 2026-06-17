import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ClientIntlProvider } from '@/components/layout/ClientIntlProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { routing, type AppLocale } from '@/i18n/routing';
import { loadSettings } from '@/lib/settings';
import { normalizeThemeId } from '@/lib/themes';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as AppLocale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const theme = normalizeThemeId(loadSettings().theme);

  return (
    <html lang={locale} data-theme={theme} suppressHydrationWarning>
      <body className={GeistSans.className}>
        <ClientIntlProvider locale={locale as AppLocale} initialMessages={messages}>
          <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
          <Toaster />
        </ClientIntlProvider>
      </body>
    </html>
  );
}
