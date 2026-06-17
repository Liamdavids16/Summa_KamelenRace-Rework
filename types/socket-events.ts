import type {
  AdminAddQuestionPayload,
  AdminData,
  AdminDeleteQuestionPayload,
  AdminErrorPayload,
  AdminUpdateSettingsPayload,
  BackToLobbyData,
  GlobalSettings,
  JoinRoomPayload,
  Leaderboard,
  LobbyUpdateData,
  NotEnoughPlayersData,
  Question,
  Room,
  SafeRooms,
  SocketErrorPayload,
  WaitingPhaseData,
} from './game';

export interface ServerToClientEvents {
  mySocketId: (id: string) => void;
  settingsUpdated: (settings: GlobalSettings) => void;
  updateLeaderboard: (leaderboard: Leaderboard) => void;
  activeRoomsList: (rooms: string[]) => void;
  lobbyRoomsUpdated: (rooms: SafeRooms) => void;
  availableCategories: (categories: string[]) => void;
  roomStatus: (exists: boolean) => void;
  waitingPhase: (data: WaitingPhaseData) => void;
  lobbyUpdate: (data: LobbyUpdateData) => void;
  countdownStarted: (tijd: number) => void;
  timerUpdate: (tijd: number) => void;
  gameStarted: () => void;
  newQuestion: (qData: Question) => void;
  updateGame: (players: Room['players']) => void;
  camelStepped: (playerId: string) => void;
  winner: (winnerName: string) => void;
  kickedAfterRound: () => void;
  backToLobby: (data: BackToLobbyData | number) => void;
  youAreNowCreator: () => void;
  notEnoughPlayers: (data: NotEnoughPlayersData) => void;
  errorMessage: (payload: SocketErrorPayload) => void;
  adminData: (data: AdminData) => void;
  adminError: (payload: AdminErrorPayload) => void;
}

export interface ClientToServerEvents {
  checkRoom: (name: string) => void;
  joinRoom: (payload: JoinRoomPayload) => void;
  creatorStartCountdown: () => void;
  submitAnswer: (idx: number) => void;
  leaveRoom: () => void;
  setPlayerLocale: (locale: string) => void;
  adminLogin: (pass: string, locale?: string) => void;
  adminSetQuestionLocale: (locale: string) => void;
  adminForceStart: (name: string) => void;
  adminDeleteRoom: (name: string) => void;
  adminResetLeaderboard: () => void;
  adminUpdateSettings: (newSettings: AdminUpdateSettingsPayload) => void;
  adminAddCategory: (catName: string) => void;
  adminDeleteCategory: (catName: string) => void;
  adminAddQuestion: (payload: AdminAddQuestionPayload) => void;
  adminDeleteQuestion: (payload: AdminDeleteQuestionPayload) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  roomId?: string;
  adminQuestionLocale?: string;
}
