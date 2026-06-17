import type { GlobalSettings, Leaderboard, Room } from '@/types/game';
import { loadLeaderboard } from '@/lib/leaderboard';
import { loadSettings } from '@/lib/settings';

function LoadAdminPasswords(): string[] {
  const raw = process.env.ADMIN_PASSWORDS;
  if (!raw?.trim()) return [];
  return raw.split(',').map((password) => password.trim()).filter(Boolean);
}

export const AdminPasswords = LoadAdminPasswords();

const globalStore = globalThis as typeof globalThis & {
  __kamelenRooms?: Record<string, Room>;
  __kamelenSettings?: GlobalSettings;
  __kamelenLeaderboard?: Leaderboard;
};

export const rooms: Record<string, Room> =
  globalStore.__kamelenRooms ?? (globalStore.__kamelenRooms = {});

export const globalSettings: GlobalSettings =
  globalStore.__kamelenSettings ?? (globalStore.__kamelenSettings = loadSettings());

const leaderboardState: Leaderboard =
  globalStore.__kamelenLeaderboard ?? (globalStore.__kamelenLeaderboard = loadLeaderboard());

export function getLeaderboard(): Leaderboard {
  return leaderboardState;
}

export function clearLeaderboard(): void {
  for (const key of Object.keys(leaderboardState)) {
    delete leaderboardState[key];
  }
}
