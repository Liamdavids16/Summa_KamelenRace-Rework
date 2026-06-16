'use client';

import { useEffect } from 'react';
import { applyTheme } from '@/lib/apply-theme';
import { createSocket } from '@/lib/socket/client';
import type { LobbyResponse } from '@/types/api';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const res = await fetch('/api/lobby', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as LobbyResponse;
        if (data.settings?.theme) applyTheme(data.settings.theme);
      } catch {
      }
    };

    void loadTheme();

    const socket = createSocket();
    socket.on('settingsUpdated', (settings) => {
      if (settings.theme) applyTheme(settings.theme);
    });
    socket.connect();

    return () => {
      socket.disconnect();
      socket.removeAllListeners();
    };
  }, []);

  return children;
}
