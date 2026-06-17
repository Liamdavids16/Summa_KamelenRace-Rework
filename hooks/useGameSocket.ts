'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { GameSocket } from '@/lib/socket/client';
import {
  areGameSocketListenersBound,
  destroyGameSocket,
  getActiveGameRoom,
  getGameSocket,
  markGameSocketListenersBound,
  releaseGameSocket,
  retainGameSocket,
  setActiveGameRoom,
} from '@/lib/socket/game-socket';
import { clearJoinSession, loadJoinSession, saveJoinSession } from '@/lib/join-session';
import { getClientInstanceId } from '@/lib/client-instance';
import { applyTheme } from '@/lib/apply-theme';
import { useSocketErrorMessage } from '@/hooks/useSocketErrorMessage';
import type {
  GlobalSettings,
  LobbyPlayer,
  Player,
  Question,
  SocketErrorPayload,
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
  hasCompletedRound: boolean;
  autoStartDelaySeconds: number;
  error: string | null;
  nameConflict: boolean;
}

type GameAction =
  | { type: 'SetSocketId'; id: string }
  | { type: 'SetSettings'; settings: GlobalSettings }
  | { type: 'WaitingPhase'; data: WaitingPhaseData; roomName: string; mixLabel: string }
  | { type: 'LobbyUpdate'; players: LobbyPlayer[]; countdownStarted: boolean; creatorId: string }
  | { type: 'CountdownStarted'; tijd: number }
  | { type: 'TimerUpdate'; tijd: number }
  | { type: 'GameStarted' }
  | { type: 'NewQuestion'; question: Question }
  | { type: 'SelectAnswer'; index: number }
  | { type: 'AnswerWrong'; error: string }
  | { type: 'LockQuestion' }
  | { type: 'UpdateGame'; players: Record<string, Player> }
  | { type: 'Winner'; name: string }
  | { type: 'BackToLobby'; tijd: number; creatorId: string | null; mySocketId: string | null; countdownStarted: boolean }
  | { type: 'SetCreator'; isCreator: boolean }
  | { type: 'SetError'; error: string | null }
  | { type: 'NameConflict' }
  | { type: 'ClearNameConflict' };

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
  hasCompletedRound: false,
  autoStartDelaySeconds: 10,
  error: null,
  nameConflict: false,
};

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SetSocketId':
      return { ...state, mySocketId: action.id };
    case 'SetSettings':
      return {
        ...state,
        settings: action.settings,
        minPlayers: action.settings.minPlayers,
        maxPlayers: action.settings.maxPlayers,
      };
    case 'WaitingPhase': {
      const catText =
        action.data.categories.length > 2
          ? action.mixLabel
          : action.data.categories.join(' & ');
      const roomSettings = action.data.settings;
      return {
        ...state,
        phase: action.data.countdownStarted ? 'countdown' : 'waiting',
        isCreator: action.data.isCreator,
        countdown: action.data.tijd,
        countdownStarted: action.data.countdownStarted,
        roomTitle: `${action.roomName}${catText ? ` (${catText})` : ''}`,
        winnerName: null,
        question: null,
        minPlayers: roomSettings.minPlayers,
        maxPlayers: roomSettings.maxPlayers,
        settings: {
          theme: roomSettings.theme,
          minPlayers: roomSettings.minPlayers,
          maxPlayers: roomSettings.maxPlayers,
          questionsPerRound: roomSettings.questionsPerRound,
        },
        autoStartDelaySeconds: roomSettings.autoStartDelaySeconds,
      };
    }
    case 'LobbyUpdate':
      return {
        ...state,
        lobbyPlayers: action.players,
        creatorId: action.creatorId,
        countdownStarted: action.countdownStarted,
        phase: action.countdownStarted && state.phase === 'waiting' ? 'countdown' : state.phase,
      };
    case 'CountdownStarted':
      return { ...state, phase: 'countdown', countdown: action.tijd, countdownStarted: true };
    case 'TimerUpdate':
      return { ...state, countdown: action.tijd };
    case 'GameStarted':
      return {
        ...state,
        phase: 'playing',
        questionLocked: false,
        selectedAnswer: null,
        showAnswerFeedback: false,
        hasCompletedRound: true,
      };
    case 'NewQuestion':
      return {
        ...state,
        question: action.question,
        questionLocked: false,
        selectedAnswer: null,
        showAnswerFeedback: false,
        error: null,
      };
    case 'SelectAnswer':
      return {
        ...state,
        questionLocked: true,
        selectedAnswer: action.index,
        showAnswerFeedback: false,
      };
    case 'AnswerWrong':
      return { ...state, showAnswerFeedback: true, error: action.error };
    case 'LockQuestion':
      return { ...state, questionLocked: true };
    case 'UpdateGame':
      return { ...state, players: action.players };
    case 'Winner':
      return {
        ...state,
        phase: 'finished',
        winnerName: action.name,
        question: null,
        selectedAnswer: null,
        showAnswerFeedback: false,
        error: null,
      };
    case 'BackToLobby':
      return {
        ...state,
        phase: action.countdownStarted ? 'countdown' : 'waiting',
        winnerName: null,
        question: null,
        selectedAnswer: null,
        showAnswerFeedback: false,
        error: null,
        countdown: action.tijd,
        countdownStarted: action.countdownStarted,
        isCreator: action.creatorId ? action.mySocketId === action.creatorId : state.isCreator,
      };
    case 'SetCreator':
      return { ...state, isCreator: action.isCreator };
    case 'SetError':
      return { ...state, error: action.error };
    case 'NameConflict':
      return { ...state, nameConflict: true };
    case 'ClearNameConflict':
      return { ...state, nameConflict: false };
    default:
      return state;
  }
}

function applyGameTheme(theme: string) {
  applyTheme(theme);
}

export function useGameSocket(roomSlug: string) {
  const router = useRouter();
  const locale = useLocale();
  const tToast = useTranslations('toast');
  const tGame = useTranslations('game');
  const resolveError = useSocketErrorMessage();
  const [state, dispatch] = useReducer(reducer, initialState);
  const socketRef = useRef<GameSocket | null>(null);
  const mySocketIdRef = useRef<string | null>(null);
  const resolveErrorRef = useRef(resolveError);
  const leaveRef = useRef<() => void>(() => {});
  const routerRef = useRef(router);
  const localeRef = useRef(locale);
  const tToastRef = useRef(tToast);
  const tGameRef = useRef(tGame);

  resolveErrorRef.current = resolveError;
  routerRef.current = router;
  localeRef.current = locale;
  tToastRef.current = tToast;
  tGameRef.current = tGame;

  const leave = useCallback(() => {
    const socket = socketRef.current;
    if (socket) {
      socket.emit('leaveRoom');
      destroyGameSocket();
    }
    clearJoinSession();
    router.push('/');
  }, [router]);

  leaveRef.current = leave;

  const startCountdown = useCallback(() => {
    socketRef.current?.emit('creatorStartCountdown');
  }, []);

  const submitAnswer = useCallback((index: number) => {
    dispatch({ type: 'SelectAnswer', index });
    socketRef.current?.emit('submitAnswer', index);
  }, []);

  useEffect(() => {
    mySocketIdRef.current = state.mySocketId;
  }, [state.mySocketId]);

  useEffect(() => {
    const session = loadJoinSession();
    if (!session || decodeURIComponent(roomSlug) !== session.roomName) {
      routerRef.current.replace('/');
      return;
    }

    const socket = getGameSocket();
    socketRef.current = socket;
    retainGameSocket();
    const resumingSameRoom = getActiveGameRoom() === session.roomName;
    let joined = resumingSameRoom && socket.connected;
    let joinFallbackTimer: ReturnType<typeof setTimeout> | undefined;

    const emitJoinRoom = () => {
      socket.emit('joinRoom', {
        playerName: session.playerName,
        roomName: session.roomName,
        categories: session.categories,
        locale: localeRef.current,
        clientInstanceId: getClientInstanceId(),
        ...(session.settings ? { settings: session.settings } : {}),
      });
    };

    const join = () => {
      if (joined || !socket.connected) return;
      joined = true;
      setActiveGameRoom(session.roomName);
      emitJoinRoom();
    };

    const scheduleJoin = () => {
      if (joined) return;
      const engine = socket.io.engine;
      if (engine.transport.name === 'polling') {
        engine.once('upgrade', join);
        joinFallbackTimer = setTimeout(join, 300);
        return;
      }
      join();
    };

    const resumeOrJoin = () => {
      if (resumingSameRoom && socket.connected) {
        joined = true;
        emitJoinRoom();
        return;
      }
      scheduleJoin();
    };

    if (!areGameSocketListenersBound()) {
      socket.on('connect', resumeOrJoin);
      socket.on('mySocketId', (id) => dispatch({ type: 'SetSocketId', id }));
      socket.on('waitingPhase', (data) => {
        dispatch({
          type: 'WaitingPhase',
          data,
          roomName: session.roomName,
          mixLabel: tGameRef.current('mix'),
        });
        if (data.settings?.theme) applyGameTheme(data.settings.theme);
      });
      socket.on('lobbyUpdate', (data) => {
        dispatch({
          type: 'LobbyUpdate',
          players: data.players,
          countdownStarted: data.countdownStarted,
          creatorId: data.creatorId,
        });
      });
      socket.on('countdownStarted', (tijd) => dispatch({ type: 'CountdownStarted', tijd }));
      socket.on('timerUpdate', (tijd) => dispatch({ type: 'TimerUpdate', tijd }));
      socket.on('gameStarted', () => dispatch({ type: 'GameStarted' }));
      socket.on('newQuestion', (q) => dispatch({ type: 'NewQuestion', question: q }));
      socket.on('updateGame', (players) => dispatch({ type: 'UpdateGame', players }));
      socket.on('winner', (name) => dispatch({ type: 'Winner', name }));
      socket.on('kickedAfterRound', () => {
        toast.message(tToastRef.current('roundEndedKicked'));
        clearJoinSession();
        routerRef.current.push('/');
      });
      socket.on('youAreNowCreator', () => {
        dispatch({ type: 'SetCreator', isCreator: true });
        toast.message(tToastRef.current('youAreHost'));
      });
      socket.on('notEnoughPlayers', (data) => {
        toast.error(tToastRef.current('notEnoughPlayers', { count: data.min - data.current }));
      });
      socket.on('backToLobby', (data) => {
        const creatorId = data && typeof data === 'object' && 'creatorId' in data ? data.creatorId : null;
        const tijd =
          data && typeof data === 'object' && 'tijd' in data
            ? data.tijd
            : typeof data === 'number'
              ? data
              : 10;
        const countdownStarted =
          data && typeof data === 'object' && 'countdownStarted' in data
            ? Boolean(data.countdownStarted)
            : false;
        dispatch({
          type: 'BackToLobby',
          tijd,
          creatorId,
          mySocketId: mySocketIdRef.current,
          countdownStarted,
        });
      });
      socket.on('errorMessage', (payload: SocketErrorPayload) => {
        if (payload.code === 'nameTaken') {
          dispatch({ type: 'NameConflict' });
          return;
        }
        const msg = resolveErrorRef.current(payload);
        if (payload.code === 'wrongAnswer') {
          dispatch({ type: 'AnswerWrong', error: msg });
        } else {
          toast.error(msg);
          if (payload.code === 'roomClosedByAdmin' || payload.code === 'roomFull') leaveRef.current();
        }
      });
      markGameSocketListenersBound();
    }

    if (socket.connected) resumeOrJoin();
    else socket.connect();

    return () => {
      if (joinFallbackTimer) clearTimeout(joinFallbackTimer);
      socketRef.current = null;

      const stillOnRoomPage = window.location.pathname.includes('/room/');
      if (!stillOnRoomPage && joined) {
        setActiveGameRoom(null);
        socket.emit('leaveRoom');
        releaseGameSocket(true);
        return;
      }
      releaseGameSocket(false);
    };
  }, [roomSlug]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !getActiveGameRoom()) return;
    socket.emit('setPlayerLocale', locale);
  }, [locale]);

  const rejoinWithName = useCallback((newName: string) => {
    const session = loadJoinSession();
    const socket = socketRef.current;
    const trimmed = newName.trim();
    if (!session || !socket || !trimmed) return false;

    saveJoinSession({
      ...session,
      playerName: trimmed,
    });
    dispatch({ type: 'ClearNameConflict' });
    socket.emit('joinRoom', {
      playerName: trimmed,
      roomName: session.roomName,
      categories: session.categories,
      locale: localeRef.current,
      clientInstanceId: getClientInstanceId(),
      ...(session.settings ? { settings: session.settings } : {}),
    });
    return true;
  }, []);

  return { state, leave, startCountdown, submitAnswer, rejoinWithName };
}
