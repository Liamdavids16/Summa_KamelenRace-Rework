import type { GlobalSettings, Leaderboard, SafeRoom, SafeRooms } from '@/types/game';

export interface PublicSettings {
  theme: GlobalSettings['theme'];
  minPlayers: number;
  maxPlayers: number;
  questionsPerRound: number;
}

export interface RoomListResponse {
  rooms: SafeRooms;
}

export interface RoomDetailResponse {
  exists: boolean;
  status?: SafeRoom['status'];
  playerCount?: number;
  maxPlayers: number;
}

export interface CategoriesResponse {
  categories: string[];
}

export interface LeaderboardResponse {
  leaderboard: Leaderboard;
}

export interface SettingsResponse {
  settings: PublicSettings;
}

export interface LobbyResponse {
  rooms: SafeRooms;
  categories: string[];
  leaderboard: Leaderboard;
  settings: PublicSettings;
}
