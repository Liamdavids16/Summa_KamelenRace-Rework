import { getClientInstanceId } from '@/lib/client-instance';
import type { RoomSettings } from '@/types/game';

export const JoinSessionKey = 'kamelenrace:join';

export interface JoinSession {
  playerName: string;
  roomName: string;
  categories: string[];
  settings?: RoomSettings;
  clientInstanceId?: string;
}

export function saveJoinSession(session: JoinSession): void {
  sessionStorage.setItem(
    JoinSessionKey,
    JSON.stringify({
      ...session,
      clientInstanceId: session.clientInstanceId ?? getClientInstanceId(),
    })
  );
}

export function loadJoinSession(): JoinSession | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(JoinSessionKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as JoinSession;
  } catch {
    return null;
  }
}

export function clearJoinSession(): void {
  sessionStorage.removeItem(JoinSessionKey);
}
