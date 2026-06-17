import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@/types/socket-events';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSocket(): GameSocket {
  return io({
    path: '/socket.io',
    autoConnect: false,
    transports: ['websocket', 'polling'],
  });
}
