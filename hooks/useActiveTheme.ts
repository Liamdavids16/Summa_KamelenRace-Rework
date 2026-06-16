'use client';

import { useEffect, useState } from 'react';
import { getThemeConfig, type ThemeConfig } from '@/lib/theme-config';
import { normalizeThemeId, type ThemeId } from '@/lib/themes';

function readThemeFromDom(): ThemeId {
  if (typeof document === 'undefined') return 'desert';
  return normalizeThemeId(document.documentElement.getAttribute('data-theme') ?? 'desert');
}

export function useActiveTheme(): ThemeConfig {
  const [themeId, setThemeId] = useState<ThemeId>('desert');

  useEffect(() => {
    setThemeId(readThemeFromDom());

    const observer = new MutationObserver(() => {
      setThemeId(readThemeFromDom());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  return getThemeConfig(themeId);
}
