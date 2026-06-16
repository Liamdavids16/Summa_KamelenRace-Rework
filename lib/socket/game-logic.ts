import type { Server as SocketIOServer } from 'socket.io';
import type { Question, SafeRooms } from '@/types/game';
import { refreshQuestionBank } from '@/lib/questions';
import { rooms } from './state';

let ioInstance: SocketIOServer | null = null;

export function setIO(io: SocketIOServer): void {
  ioInstance = io;
}

export function getIO(): SocketIOServer {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized');
  }
  return ioInstance;
}

export function getRandomQuestion(cats: string[]): Question {
  const bank = refreshQuestionBank();
  let pool: Question[] = [];
  cats.forEach((c) => {
    if (bank[c]) pool = pool.concat(bank[c]);
  });
  if (pool.length === 0) pool = bank['HTML & CSS'];

  const original = pool[Math.floor(Math.random() * pool.length)];
  const correctText = original.options[original.answer];
  const shuffled: Question = {
    q: original.q,
    options: [...original.options] as Question['options'],
    answer: original.answer,
  };
  for (let i = shuffled.options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled.options[i], shuffled.options[j]] = [shuffled.options[j], shuffled.options[i]];
  }
  shuffled.answer = shuffled.options.indexOf(correctText);
  return shuffled;
}

export function getSafeRooms(): SafeRooms {
  const safe: SafeRooms = {};
  for (const id in rooms) {
    safe[id] = {
      categories: rooms[id].categories,
      status: rooms[id].status,
      countdown: rooms[id].countdown,
      countdownStarted: rooms[id].countdownStarted,
      creatorId: rooms[id].creatorId,
      players: Object.values(rooms[id].players).map((p) => ({
        name: p.name,
        progress: p.progress,
      })),
      playerCount: Object.keys(rooms[id].players).length,
    };
  }
  return safe;
}

export function broadcastRooms(): void {
  const safe = getSafeRooms();
  getIO().emit('lobbyRoomsUpdated', safe);
  getIO().emit('activeRoomsList', Object.keys(rooms));
}

export function broadcastLobbyUpdate(roomName: string): void {
  const room = rooms[roomName];
  if (!room) return;
  const lobbyPlayers = Object.values(room.players).map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
  }));
  getIO()
    .to(roomName)
    .emit('lobbyUpdate', {
      players: lobbyPlayers,
      creatorId: room.creatorId,
      countdownStarted: room.countdownStarted,
    });
}
