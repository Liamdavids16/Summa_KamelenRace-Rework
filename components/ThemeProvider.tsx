'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { applyTheme } from '@/lib/apply-theme';
import { createSocket } from '@/lib/socket/client';
import { normalizeThemeId, type ThemeId } from '@/lib/themes';

const ThemeContext = createContext<ThemeId>('desert');

export function useThemeId(): ThemeId {
  return useContext(ThemeContext);
}

function readThemeFromDom(): ThemeId {
  return normalizeThemeId(document.documentElement.getAttribute('data-theme') ?? 'desert');
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme: ThemeId;
}) {
  const [themeId, setThemeId] = useState<ThemeId>(initialTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeId(readThemeFromDom());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const socket = createSocket();
    socket.on('settingsUpdated', (settings) => {
      if (settings.theme) {
        const next = normalizeThemeId(settings.theme);
        applyTheme(next);
        setThemeId(next);
      }
    });
    socket.connect();

    return () => {
      observer.disconnect();
      socket.disconnect();
      socket.removeAllListeners();
    };
  }, []);

  return <ThemeContext.Provider value={themeId}>{children}</ThemeContext.Provider>;
}
