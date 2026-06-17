'use client';

import { useThemeId } from '@/components/ThemeProvider';
import { useTranslations } from 'next-intl';
import { Themes, type ThemeId } from '@/lib/themes';

export interface ThemeDisplay {
  id: ThemeId;
  label: string;
  heroTitle: string;
  heroSubtitle: string;
}

export function useActiveTheme(): ThemeDisplay {
  const themeId = useThemeId();
  const t = useTranslations('themes');

  return {
    id: themeId,
    label: t(themeId),
    heroTitle: t('heroTitle'),
    heroSubtitle: t(`${themeId}Subtitle`),
  };
}

export function useThemeLabel(themeId: ThemeId): string {
  const t = useTranslations('themes');
  return t(themeId);
}

export function useThemeOptions(): { id: ThemeId; label: string }[] {
  const t = useTranslations('themes');
  return Themes.map((id) => ({ id, label: t(id) }));
}
