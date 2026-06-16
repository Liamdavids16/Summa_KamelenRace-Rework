'use client';

import { useCallback, useEffect, useState } from 'react';
import { createSocket } from '@/lib/socket/client';
import type { LobbyResponse } from '@/types/api';
import type { SafeRooms } from '@/types/game';
import type { ThemeId } from '@/lib/themes';

export interface LobbyData {
  rooms: SafeRooms;
  categories: string[];
  leaderboard: LobbyResponse['leaderboard'];
  settings: LobbyResponse['settings'];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLobbyData(): LobbyData {
  const [rooms, setRooms] = useState<SafeRooms>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<LobbyResponse['leaderboard']>({});
  const [settings, setSettings] = useState<LobbyResponse['settings']>({
    theme: 'desert' as ThemeId,
    minPlayers: 4,
    maxPlayers: 8,
    questionsPerRound: 10,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lobby', { cache: 'no-store' });
      if (!res.ok) throw new Error('Kon lobbygegevens niet laden');

      const data = (await res.json()) as LobbyResponse;
      setRooms(data.rooms);
      setCategories(data.categories);
      setLeaderboard(data.leaderboard);
      setSettings(data.settings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const socket = createSocket();
    socket.on('lobbyRoomsUpdated', (updatedRooms) => {
      setRooms(updatedRooms);
      setLoading(false);
    });
    socket.connect();

    return () => {
      socket.disconnect();
      socket.removeAllListeners();
    };
  }, [refresh]);

  return { rooms, categories, leaderboard, settings, loading, error, refresh };
}
