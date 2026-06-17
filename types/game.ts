export interface Question {
  q: string;
  options: [string, string, string, string];
  answer: number;
}

export type QuestionBank = Record<string, Question[]>;

export interface GlobalSettings {
  theme: string;
  minPlayers: number;
  maxPlayers: number;
  questionsPerRound: number;
}

export interface RoomSettings {
  theme: string;
  minPlayers: number;
  maxPlayers: number;
  questionsPerRound: number;
  countdownSeconds: number;
  autoKickAfterRound: boolean;
  autoStartDelaySeconds: number;
}

export interface Player {
  id: string;
  name: string;
  progress: number;
  color: string;
  currentQuestion: Question;
}

export type RoomStatus = 'waiting' | 'playing';

export interface Room {
  categories: string[];
  players: Record<string, Player>;
  hasWinner: boolean;
  status: RoomStatus;
  countdown: number;
  timerId: ReturnType<typeof setInterval> | null;
  roundEndTimerId: ReturnType<typeof setTimeout> | null;
  creatorId: string;
  countdownStarted: boolean;
  settings: RoomSettings;
}

export interface SafeRoomPlayer {
  name: string;
  progress: number;
}

export interface SafeRoom {
  categories: string[];
  status: RoomStatus;
  countdown: number;
  countdownStarted: boolean;
  creatorId: string;
  players: SafeRoomPlayer[];
  playerCount: number;
  settings: RoomSettings;
}

export type SafeRooms = Record<string, SafeRoom>;

export type Leaderboard = Record<string, number>;

export interface LobbyPlayer {
  id: string;
  name: string;
  color: string;
}

export interface WaitingPhaseData {
  tijd: number;
  categories: string[];
  isCreator: boolean;
  countdownStarted: boolean;
  settings: RoomSettings;
}

export interface LobbyUpdateData {
  players: LobbyPlayer[];
  creatorId: string;
  countdownStarted: boolean;
}

export interface BackToLobbyData {
  tijd: number;
  creatorId: string;
  countdownStarted?: boolean;
}

export interface NotEnoughPlayersData {
  current: number;
  min: number;
}

export interface AdminData {
  rooms: SafeRooms;
  leaderboard: Leaderboard;
  questionBank: QuestionBank;
  settings: GlobalSettings;
}

export interface JoinRoomPayload {
  playerName: string;
  roomName: string;
  categories: string[];
  settings?: RoomSettings;
}

export interface AdminAddQuestionPayload {
  category: string;
  questionObj: Question;
}

export interface AdminDeleteQuestionPayload {
  category: string;
  index: number;
}

export interface AdminUpdateSettingsPayload {
  theme?: string;
  minPlayers?: number;
  maxPlayers?: number;
  questionsPerRound?: number;
}
