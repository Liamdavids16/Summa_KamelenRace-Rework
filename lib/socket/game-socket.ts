import { createSocket, type GameSocket } from '@/lib/socket/client';

let gameSocket: GameSocket | null = null;
let activeGameRoom: string | null = null;
let hookMountCount = 0;
let deferredTeardownTimer: ReturnType<typeof setTimeout> | null = null;
let listenersBound = false;

export function areGameSocketListenersBound(): boolean {
  return listenersBound;
}

export function markGameSocketListenersBound(): void {
  listenersBound = true;
}

export function getGameSocket(): GameSocket {
  if (!gameSocket) {
    gameSocket = createSocket();
  }
  return gameSocket;
}

export function getActiveGameRoom(): string | null {
  return activeGameRoom;
}

export function setActiveGameRoom(roomName: string | null): void {
  activeGameRoom = roomName;
}

export function retainGameSocket(): void {
  if (deferredTeardownTimer) {
    clearTimeout(deferredTeardownTimer);
    deferredTeardownTimer = null;
  }
  hookMountCount += 1;
}

export function releaseGameSocket(shouldDestroy: boolean): void {
  hookMountCount = Math.max(0, hookMountCount - 1);
  if (shouldDestroy) {
    if (deferredTeardownTimer) clearTimeout(deferredTeardownTimer);
    deferredTeardownTimer = null;
    destroyGameSocket();
    return;
  }
  if (hookMountCount > 0) return;
  if (deferredTeardownTimer) clearTimeout(deferredTeardownTimer);
  deferredTeardownTimer = setTimeout(() => {
    deferredTeardownTimer = null;
    if (hookMountCount > 0) return;
    if (!window.location.pathname.includes('/room/')) {
      destroyGameSocket();
    }
  }, 0);
}

export function destroyGameSocket(): void {
  if (!gameSocket) return;
  gameSocket.disconnect();
  gameSocket.removeAllListeners();
  gameSocket = null;
  activeGameRoom = null;
  listenersBound = false;
}
