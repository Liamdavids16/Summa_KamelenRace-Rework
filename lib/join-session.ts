export const JOIN_SESSION_KEY = 'kamelenrace:join';

export interface JoinSession {
  playerName: string;
  roomName: string;
  categories: string[];
}

export function saveJoinSession(session: JoinSession): void {
  sessionStorage.setItem(JOIN_SESSION_KEY, JSON.stringify(session));
}

export function loadJoinSession(): JoinSession | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(JOIN_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as JoinSession;
  } catch {
    return null;
  }
}

export function clearJoinSession(): void {
  sessionStorage.removeItem(JOIN_SESSION_KEY);
}
