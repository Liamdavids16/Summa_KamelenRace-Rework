'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { useActiveTheme } from '@/hooks/useActiveTheme';

interface ThemedShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  badges?: ReactNode;
  actions?: ReactNode;
  showHero?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const maxWidthClass = {
  sm: 'max-w-md',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

export function ThemedShell({
  children,
  title,
  subtitle,
  badges,
  actions,
  showHero = true,
  maxWidth = 'lg',
}: ThemedShellProps) {
  const theme = useActiveTheme();
  const t = useTranslations('common');

  return (
    <div className="page-shell flex min-h-screen flex-col">
      {showHero && (
        <header className="glass-hero sticky top-0 z-10 w-full">
          <div
            className={`mx-auto flex w-full flex-col gap-4 px-4 py-5 sm:px-6 ${maxWidthClass[maxWidth]}`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                  {t('brand')}
                </p>
                <h1 className="hero-title">{title ?? theme.heroTitle}</h1>
                {(subtitle ?? theme.heroSubtitle) && (
                  <p className="text-sm text-muted-foreground">{subtitle ?? theme.heroSubtitle}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {badges}
                <LocaleSwitcher />
                {actions}
              </div>
            </div>
          </div>
        </header>
      )}

      <main className={`mx-auto w-full flex-1 px-4 py-8 sm:px-6 ${maxWidthClass[maxWidth]}`}>
        {children}
      </main>
    </div>
  );
}
