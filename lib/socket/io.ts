import type { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '@/types/socket-events';
import { refreshQuestionBank } from '@/lib/questions';
import { setIO } from './game-logic';
import { registerSocketHandlers } from './handlers';

type HttpServerWithIO = HTTPServer & {
  io?: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
};

export function attachSocketIO(
  httpServer: HTTPServer
): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
  const server = httpServer as HttpServerWithIO;

  if (server.io) {
    return server.io;
  }

  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    { cors: { origin: '*' } }
  );

  setIO(io);

  io.on('connection', (socket) => {
    registerSocketHandlers(socket);
  });

  server.io = io;

  const bank = refreshQuestionBank();
  let total = 0;
  for (const cat in bank) total += bank[cat].length;
  console.log('🚀 Socket.IO geïnitialiseerd');
  console.log(`📚 ${total} vragen geladen.`);

  return io;
}
