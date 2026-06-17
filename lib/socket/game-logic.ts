import type { Server as SocketIOServer } from 'socket.io';
import type { Question, SafeRooms } from '@/types/game';
import { Locales } from '@/i18n/routing';
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

export interface QuestionSlot {
  category: string;
  index: number;
}

export function ShuffleQuestion(original: Question): Question {
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

export function PickRandomQuestionSlot(
  cats: string[],
  locale = 'nl'
): { question: Question; category: string; index: number } {
  const bank = refreshQuestionBank(locale);
  const availableCats = cats.filter((category) => bank[category]?.length);
  const category =
    availableCats[Math.floor(Math.random() * availableCats.length)] ?? 'HTML & CSS';
  const questions = bank[category] ?? bank['HTML & CSS'] ?? [];
  const index = Math.floor(Math.random() * questions.length);
  return {
    question: ShuffleQuestion(questions[index]),
    category,
    index,
  };
}

export function ResolveQuestionSlot(locale: string, category: string, index: number): Question | null {
  const bank = refreshQuestionBank(locale);
  const original = bank[category]?.[index];
  if (!original) return null;
  return ShuffleQuestion(original);
}

export function FindQuestionSlot(
  question: Question,
  cats: string[],
  locale: string
): QuestionSlot | null {
  const bank = refreshQuestionBank(locale);
  for (const category of cats) {
    const list = bank[category];
    if (!list) continue;
    const index = list.findIndex((item) => item.q === question.q);
    if (index >= 0) return { category, index };
  }
  return null;
}

export function FindQuestionSlotInAnyLocale(question: Question, cats: string[]): QuestionSlot | null {
  for (const locale of Locales) {
    const slot = FindQuestionSlot(question, cats, locale);
    if (slot) return slot;
  }
  return null;
}

export function getRandomQuestion(cats: string[], locale = 'nl'): Question {
  return PickRandomQuestionSlot(cats, locale).question;
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
      settings: rooms[id].settings,
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
