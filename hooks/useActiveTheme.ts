'use client';

import { useThemeId } from '@/components/ThemeProvider';
import { getThemeConfig, type ThemeConfig } from '@/lib/theme-config';

export function useActiveTheme(): ThemeConfig {
  const themeId = useThemeId();
  return getThemeConfig(themeId);
}
