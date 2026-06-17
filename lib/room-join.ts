import { getClientInstanceId } from '@/lib/client-instance';
import { loadJoinSession } from '@/lib/join-session';
import type { SafeRoom } from '@/types/game';

export function NormalizePlayerName(name: string): string {
  return name.trim().toLowerCase();
}

export function IsSameClientReconnect(roomName: string, playerName: string): boolean {
  const session = loadJoinSession();
  if (!session) return false;
  if (session.roomName !== roomName) return false;
  if (NormalizePlayerName(session.playerName) !== NormalizePlayerName(playerName)) return false;
  return session.clientInstanceId === getClientInstanceId();
}

export function IsPlayerNameTakenInRoom(
  room: SafeRoom | undefined,
  playerName: string,
  roomName: string
): boolean {
  if (!room) return false;

  const normalized = NormalizePlayerName(playerName);
  if (!normalized) return false;

  if (IsSameClientReconnect(roomName, playerName)) return false;

  return room.players.some((player) => NormalizePlayerName(player.name) === normalized);
}
