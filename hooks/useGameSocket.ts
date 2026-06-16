'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createSocket, type GameSocket } from '@/lib/socket/client';
import { clearJoinSession, loadJoinSession } from '@/lib/join-session';
import { applyTheme } from '@/lib/apply-theme';
import type {
  GlobalSettings,
  LobbyPlayer,
  Player,
  Question,
  WaitingPhaseData,
} from '@/types/game';

export type GamePhase = 'connecting' | 'waiting' | 'countdown' | 'playing' | 'finished';

interface GameState {
  phase: GamePhase;
  mySocketId: string | null;
  isCreator: boolean;
  players: Record<string, Player>;
  lobbyPlayers: LobbyPlayer[];
  creatorId: string | null;
  question: Question | null;
  questionLocked: boolean;
  selectedAnswer: number | null;
  showAnswerFeedback: boolean;
  countdown: number;
  countdownStarted: boolean;
  winnerName: string | null;
  roomTitle: string;
  settings: GlobalSettings;
  minPlayers: number;
  maxPlayers: number;
  error: string | null;
}

type GameAction =
  | { type: 'SET_SOCKET_ID'; id: string }
  | { type: 'SET_SETTINGS'; settings: GlobalSettings }
  | { type: 'WAITING_PHASE'; data: WaitingPhaseData; roomName: string }
  | { type: 'LOBBY_UPDATE'; players: LobbyPlayer[]; countdownStarted: boolean; creatorId: string }
  | { type: 'COUNTDOWN_STARTED'; tijd: number }
  | { type: 'TIMER_UPDATE'; tijd: number }
  | { type: 'GAME_STARTED' }
  | { type: 'NEW_QUESTION'; question: Question }
  | { type: 'SELECT_ANSWER'; index: number }
  | { type: 'ANSWER_WRONG'; error: string }
  | { type: 'LOCK_QUESTION' }
  | { type: 'UPDATE_GAME'; players: Record<string, Player> }
  | { type: 'WINNER'; name: string }
  | { type: 'BACK_TO_LOBBY'; tijd: number; creatorId: string | null; mySocketId: string | null }
  | { type: 'SET_CREATOR'; isCreator: boolean }
  | { type: 'SET_ERROR'; error: string | null };

const initialState: GameState = {
  phase: 'connecting',
  mySocketId: null,
  isCreator: false,
  players: {},
  lobbyPlayers: [],
  creatorId: null,
  question: null,
  questionLocked: false,
  selectedAnswer: null,
  showAnswerFeedback: false,
  countdown: 10,
  countdownStarted: false,
  winnerName: null,
  roomTitle: '',
  settings: { theme: 'desert', minPlayers: 4, maxPlayers: 8, questionsPerRound: 10 },
  minPlayers: 4,
  maxPlayers: 8,
  error: null,
};

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_SOCKET_ID':
      return { ...state, mySocketId: action.id };
    case 'SET_SETTINGS':
      return {
        ...state,
        settings: action.settings,
        minPlayers: action.settings.minPlayers,
        maxPlayers: action.settings.maxPlayers,
      };
    case 'WAITING_PHASE': {
      const catText =
        action.data.categories.length > 2
          ? 'Mix'
          : action.data.categories.join(' & ');
      return {
        ...state,
        phase: action.data.countdownStarted ? 'countdown' : 'waiting',
        isCreator: action.data.isCreator,
        countdown: action.data.tijd,
        countdownStarted: action.data.countdownStarted,
        roomTitle: `${action.roomName}${catText ? ` (${catText})` : ''}`,
        winnerName: null,
        question: null,
      };
    }
    case 'LOBBY_UPDATE':
      return {
        ...state,
        lobbyPlayers: action.players,
        creatorId: action.creatorId,
        countdownStarted: action.countdownStarted,
        phase: action.countdownStarted && state.phase === 'waiting' ? 'countdown' : state.phase,
      };
    case 'COUNTDOWN_STARTED':
      return { ...state, phase: 'countdown', countdown: action.tijd, countdownStarted: true };
    case 'TIMER_UPDATE':
      return { ...state, countdown: action.tijd };
    case 'GAME_STARTED':
      return {
        ...state,
        phase: 'playing',
        questionLocked: false,
        selectedAnswer: null,
        showAnswerFeedback: false,
      };
    case 'NEW_QUESTION':
      return {
        ...state,
        question: action.question,
        questionLocked: false,
        selectedAnswer: null,
        showAnswerFeedback: false,
        error: null,
      };
    case 'SELECT_ANSWER':
      return {
        ...state,
        questionLocked: true,
        selectedAnswer: action.index,
        showAnswerFeedback: false,
      };
    case 'ANSWER_WRONG':
      return { ...state, showAnswerFeedback: true, error: action.error };
    case 'LOCK_QUESTION':
      return { ...state, questionLocked: true };
    case 'UPDATE_GAME':
      return { ...state, players: action.players };
    case 'WINNER':
      return {
        ...state,
        phase: 'finished',
        winnerName: action.name,
        question: null,
        selectedAnswer: null,
        showAnswerFeedback: false,
        error: null,
      };
    case 'BACK_TO_LOBBY':
      return {
        ...state,
        phase: 'waiting',
        winnerName: null,
        question: null,
        selectedAnswer: null,
        showAnswerFeedback: false,
        error: null,
        countdown: action.tijd,
        countdownStarted: false,
        isCreator: action.creatorId ? action.mySocketId === action.creatorId : state.isCreator,
      };
    case 'SET_CREATOR':
      return { ...state, isCreator: action.isCreator };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    default:
      return state;
  }
}

function applyGameTheme(theme: string) {
  applyTheme(theme);
}

export function useGameSocket(roomSlug: string) {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);
  const socketRef = useRef<GameSocket | null>(null);
  const mySocketIdRef = useRef<string | null>(null);

  const leave = useCallback(() => {
    socketRef.current?.emit('leaveRoom');
    socketRef.current?.disconnect();
    clearJoinSession();
    router.push('/');
  }, [router]);

  const startCountdown = useCallback(() => {
    socketRef.current?.emit('creatorStartCountdown');
  }, []);

  const submitAnswer = useCallback((index: number) => {
    dispatch({ type: 'SELECT_ANSWER', index });
    socketRef.current?.emit('submitAnswer', index);
  }, []);

  useEffect(() => {
    mySocketIdRef.current = state.mySocketId;
  }, [state.mySocketId]);

  useEffect(() => {
    const session = loadJoinSession();
    if (!session || decodeURIComponent(roomSlug) !== session.roomName) {
      router.replace('/');
      return;
    }

    const socket = createSocket();
    socketRef.current = socket;
    let joined = false;

    const join = () => {
      if (joined) return;
      joined = true;
      socket.emit('joinRoom', {
        playerName: session.playerName,
        roomName: session.roomName,
        categories: session.categories,
      });
    };

    socket.on('connect', join);
    socket.on('mySocketId', (id) => dispatch({ type: 'SET_SOCKET_ID', id }));
    socket.on('settingsUpdated', (settings) => {
      dispatch({ type: 'SET_SETTINGS', settings });
      if (settings.theme) applyGameTheme(settings.theme);
    });
    socket.on('waitingPhase', (data) => {
      dispatch({ type: 'WAITING_PHASE', data, roomName: session.roomName });
    });
    socket.on('lobbyUpdate', (data) => {
      dispatch({
        type: 'LOBBY_UPDATE',
        players: data.players,
        countdownStarted: data.countdownStarted,
        creatorId: data.creatorId,
      });
    });
    socket.on('countdownStarted', (tijd) => dispatch({ type: 'COUNTDOWN_STARTED', tijd }));
    socket.on('timerUpdate', (tijd) => dispatch({ type: 'TIMER_UPDATE', tijd }));
    socket.on('gameStarted', () => dispatch({ type: 'GAME_STARTED' }));
    socket.on('newQuestion', (q) => dispatch({ type: 'NEW_QUESTION', question: q }));
    socket.on('updateGame', (players) => dispatch({ type: 'UPDATE_GAME', players }));
    socket.on('winner', (name) => dispatch({ type: 'WINNER', name }));
    socket.on('youAreNowCreator', () => {
      dispatch({ type: 'SET_CREATOR', isCreator: true });
      toast.message('Je bent nu de host');
    });
    socket.on('notEnoughPlayers', (data) => {
      toast.error(`Nog ${data.min - data.current} speler(s) nodig om te starten`);
    });
    socket.on('backToLobby', (data) => {
      const creatorId = data && typeof data === 'object' && 'creatorId' in data ? data.creatorId : null;
      const tijd =
        data && typeof data === 'object' && 'tijd' in data
          ? data.tijd
          : typeof data === 'number'
            ? data
            : 10;
      dispatch({
        type: 'BACK_TO_LOBBY',
        tijd,
        creatorId,
        mySocketId: mySocketIdRef.current,
      });
    });
    socket.on('errorMessage', (msg) => {
      if (msg.includes('Fout!')) {
        dispatch({ type: 'ANSWER_WRONG', error: msg });
      } else {
        toast.error(msg);
        if (msg.includes('gesloten') || msg.includes('vol')) leave();
      }
    });

    socket.connect();
    if (socket.connected) join();

    return () => {
      socket.emit('leaveRoom');
      socket.disconnect();
      socket.removeAllListeners();
      socketRef.current = null;
    };
  }, [roomSlug, router, leave]);

  return { state, leave, startCountdown, submitAnswer };
}
