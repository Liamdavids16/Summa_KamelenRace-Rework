import type { Socket } from 'socket.io';
import { Locales } from '@/i18n/routing';
import { saveLeaderboard } from '@/lib/leaderboard';
import { normalizeRoomSettings, roomSettingsFromGlobal } from '@/lib/room-settings';
import { saveSettings } from '@/lib/settings';
import { normalizeThemeId } from '@/lib/themes';
import {
  getQuestionBank,
  refreshQuestionBank,
  saveQuestionsToFile,
  setQuestionBank,
} from '@/lib/questions';
import {
  AdminPasswords,
  clearLeaderboard,
  getLeaderboard,
  globalSettings,
  rooms,
} from './state';
import {
  broadcastLobbyUpdate,
  broadcastRooms,
  getIO,
  getRandomQuestion,
  getSafeRooms,
} from './game-logic';

function NormalizeLocale(locale?: string): string {
  return Locales.includes(locale as (typeof Locales)[number]) ? locale! : 'nl';
}

function BuildAdminData(locale?: string) {
  const resolvedLocale = NormalizeLocale(locale);
  return {
    rooms: getSafeRooms(),
    leaderboard: getLeaderboard(),
    questionBank: refreshQuestionBank(resolvedLocale),
    settings: globalSettings,
    questionLocale: resolvedLocale,
  };
}

function EmitAdminData(socket: Socket): void {
  socket.emit('adminData', BuildAdminData(socket.data.adminQuestionLocale));
}

export function updateAdmin(): void {
  getIO()
    .to('admins')
    .fetchSockets()
    .then((sockets) => {
      for (const adminSocket of sockets) {
        adminSocket.emit('adminData', BuildAdminData(adminSocket.data.adminQuestionLocale));
      }
    });
}

export function ClearRoundEndTimer(name: string): void {
  const room = rooms[name];
  if (!room?.roundEndTimerId) return;
  clearTimeout(room.roundEndTimerId);
  room.roundEndTimerId = null;
}

export function StartCountdownForRoom(name: string): void {
  const room = rooms[name];
  if (!room || room.status !== 'waiting' || room.countdownStarted) return;
  if (Object.keys(room.players).length < 1) return;

  room.countdownStarted = true;
  getIO().to(name).emit('countdownStarted', room.countdown);
  startTimer(name);
  updateAdmin();
}

export function KickNonHostPlayers(name: string): void {
  const room = rooms[name];
  if (!room) return;

  const creatorId = room.creatorId;
  for (const id in room.players) {
    if (id === creatorId) continue;
    const socket = getIO().sockets.sockets.get(id);
    if (socket) {
      socket.leave(name);
      delete socket.data.roomId;
      socket.emit('kickedAfterRound');
    }
    delete room.players[id];
  }

  broadcastLobbyUpdate(name);
  broadcastRooms();
  getIO().to(name).emit('updateGame', room.players);
}

export function FinishRound(name: string): void {
  const room = rooms[name];
  if (!room) return;

  ClearRoundEndTimer(name);
  if (!room.hasWinner) return;

  if (room.settings.autoKickAfterRound) {
    KickNonHostPlayers(name);
  }

  if (rooms[name]) {
    resetRoom(name, false);
  }
}

export function startTimer(name: string): void {
  const r = rooms[name];
  r.timerId = setInterval(() => {
    r.countdown--;
    getIO().to(name).emit('timerUpdate', r.countdown);
    if (r.countdown <= 0) {
      if (r.timerId) clearInterval(r.timerId);
      r.status = 'playing';
      getIO().to(name).emit('gameStarted');
      for (const id in r.players) {
        getIO().to(id).emit('newQuestion', r.players[id].currentQuestion);
      }
    }
  }, 1000);
}

export function resetRoom(name: string, autoStartNext = false): void {
  if (!rooms[name]) return;
  ClearRoundEndTimer(name);
  rooms[name].hasWinner = false;
  rooms[name].status = 'waiting';
  rooms[name].countdown = rooms[name].settings.countdownSeconds;
  rooms[name].countdownStarted = autoStartNext;

  for (const id in rooms[name].players) {
    rooms[name].players[id].progress = 0;
    rooms[name].players[id].currentQuestion = getRandomQuestion(rooms[name].categories, rooms[name].locale);
  }

  getIO()
    .to(name)
    .emit('backToLobby', {
      tijd: rooms[name].settings.countdownSeconds,
      creatorId: rooms[name].creatorId,
      countdownStarted: autoStartNext,
    });
  getIO().to(name).emit('updateGame', rooms[name].players);
  broadcastLobbyUpdate(name);

  if (autoStartNext) {
    getIO().to(name).emit('countdownStarted', rooms[name].countdown);
    startTimer(name);
    updateAdmin();
  }
}

export function leave(socket: Socket): void {
  const name = socket.data.roomId;
  if (name && rooms[name]) {
    const wasCreator = rooms[name].creatorId === socket.id;
    delete rooms[name].players[socket.id];

    if (Object.keys(rooms[name].players).length === 0) {
      ClearRoundEndTimer(name);
      if (rooms[name].timerId) clearInterval(rooms[name].timerId);
      delete rooms[name];
      broadcastRooms();
    } else {
      if (wasCreator) {
        ClearRoundEndTimer(name);
        const nextPlayerId = Object.keys(rooms[name].players)[0];
        rooms[name].creatorId = nextPlayerId;
        getIO().to(nextPlayerId).emit('youAreNowCreator');
      }
      getIO().to(name).emit('updateGame', rooms[name].players);
      broadcastLobbyUpdate(name);
      broadcastRooms();
    }
    updateAdmin();
  }
}

export function registerSocketHandlers(socket: Socket): void {
  socket.emit('mySocketId', socket.id);
  socket.emit('settingsUpdated', globalSettings);
  socket.emit('lobbyRoomsUpdated', getSafeRooms());

  socket.on('checkRoom', (name) => {
    socket.emit('roomStatus', !!rooms[name]);
  });

  socket.on('joinRoom', ({ playerName, roomName, categories, settings, locale }) => {
    const defaultSettings = roomSettingsFromGlobal(globalSettings);
    const roomLocale = NormalizeLocale(locale);
    if (!rooms[roomName]) {
      const roomSettings = normalizeRoomSettings(settings ?? {}, defaultSettings);
      rooms[roomName] = {
        categories,
        players: {},
        hasWinner: false,
        status: 'waiting',
        countdown: roomSettings.countdownSeconds,
        timerId: null,
        roundEndTimerId: null,
        creatorId: socket.id,
        countdownStarted: false,
        settings: roomSettings,
        locale: roomLocale,
      };
      broadcastRooms();
    }
    const room = rooms[roomName];
    if (room.status === 'playing') return socket.emit('errorMessage', { code: 'raceInProgress' });
    if (Object.keys(room.players).length >= room.settings.maxPlayers)
      return socket.emit('errorMessage', {
        code: 'roomFull',
        max: room.settings.maxPlayers,
      });

    socket.join(roomName);
    socket.data.roomId = roomName;
    room.players[socket.id] = {
      id: socket.id,
      name: playerName,
      progress: 0,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
      currentQuestion: getRandomQuestion(room.categories, room.locale),
    };

    const isCreator = room.creatorId === socket.id;
    socket.emit('settingsUpdated', globalSettings);
    getIO().to(roomName).emit('updateGame', room.players);
    socket.emit('waitingPhase', {
      tijd: room.countdown,
      categories: room.categories,
      isCreator,
      countdownStarted: room.countdownStarted,
      settings: room.settings,
    });
    broadcastLobbyUpdate(roomName);
    broadcastRooms();
    updateAdmin();
  });

  socket.on('creatorStartCountdown', () => {
    const room = rooms[socket.data.roomId ?? ''];
    if (!room || room.creatorId !== socket.id) return;
    const roomId = socket.data.roomId;
    if (roomId) StartCountdownForRoom(roomId);
  });

  socket.on('submitAnswer', (idx) => {
    const roomId = socket.data.roomId;
    const room = roomId ? rooms[roomId] : undefined;
    if (!room || room.status !== 'playing' || room.hasWinner) return;
    const p = room.players[socket.id];
    if (!p) return;

    if (idx === p.currentQuestion.answer) {
      const step = 100 / room.settings.questionsPerRound;
      p.progress = Math.min(100, p.progress + step);
      if (roomId) getIO().to(roomId).emit('camelStepped', socket.id);

      if (p.progress >= 100) {
        room.hasWinner = true;
        const lb = getLeaderboard();
        lb[p.name] = (lb[p.name] || 0) + 1;
        saveLeaderboard(lb);
        getIO().emit('updateLeaderboard', lb);
        if (roomId) {
          getIO().to(roomId).emit('winner', p.name);
          ClearRoundEndTimer(roomId);
          room.roundEndTimerId = setTimeout(
            () => FinishRound(roomId),
            room.settings.autoStartDelaySeconds * 1000
          );
        }
      } else {
        p.currentQuestion = getRandomQuestion(room.categories, room.locale);
        socket.emit('newQuestion', p.currentQuestion);
      }
    } else {
      socket.emit('errorMessage', { code: 'wrongAnswer' });
      p.currentQuestion = getRandomQuestion(room.categories, room.locale);
      setTimeout(() => socket.emit('newQuestion', p.currentQuestion), 1500);
    }
    if (roomId) getIO().to(roomId).emit('updateGame', room.players);
  });

  socket.on('adminLogin', (pass, locale) => {
    if (AdminPasswords.includes(pass)) {
      socket.data.adminQuestionLocale = NormalizeLocale(locale);
      socket.join('admins');
      EmitAdminData(socket);
    } else {
      socket.emit('adminError', { code: 'wrongPassword' });
    }
  });

  socket.on('adminSetQuestionLocale', (locale) => {
    if (!socket.rooms.has('admins')) return;
    socket.data.adminQuestionLocale = NormalizeLocale(locale);
    EmitAdminData(socket);
  });

  socket.on('adminForceStart', (name) => {
    if (rooms[name]) {
      if (!rooms[name].countdownStarted) {
        rooms[name].countdownStarted = true;
        getIO().to(name).emit('countdownStarted', rooms[name].countdown);
        startTimer(name);
      } else {
        rooms[name].countdown = 0;
      }
      updateAdmin();
    }
  });

  socket.on('adminDeleteRoom', (name) => {
    if (rooms[name]) {
      ClearRoundEndTimer(name);
      if (rooms[name].timerId) clearInterval(rooms[name].timerId);
      getIO().to(name).emit('errorMessage', { code: 'roomClosedByAdmin' });
      delete rooms[name];
      broadcastRooms();
      updateAdmin();
    }
  });

  socket.on('adminResetLeaderboard', () => {
    clearLeaderboard();
    saveLeaderboard(getLeaderboard());
    getIO().emit('updateLeaderboard', getLeaderboard());
    updateAdmin();
  });

  socket.on('adminUpdateSettings', (newSettings) => {
    if (newSettings.theme) {
      globalSettings.theme = normalizeThemeId(newSettings.theme);
    }
    if (newSettings.minPlayers)
      globalSettings.minPlayers = Math.max(1, parseInt(String(newSettings.minPlayers)));
    if (newSettings.maxPlayers)
      globalSettings.maxPlayers = Math.max(
        globalSettings.minPlayers,
        parseInt(String(newSettings.maxPlayers))
      );
    globalSettings.questionsPerRound =
      newSettings.questionsPerRound || globalSettings.questionsPerRound;
    saveSettings(globalSettings);
    getIO().emit('settingsUpdated', globalSettings);
    updateAdmin();
  });

  socket.on('adminAddCategory', (catName) => {
    const locale = NormalizeLocale(socket.data.adminQuestionLocale);
    refreshQuestionBank(locale);
    const questionBank = getQuestionBank(locale);
    if (!questionBank[catName]) {
      questionBank[catName] = [];
      setQuestionBank(questionBank, locale);
      saveQuestionsToFile(questionBank, locale);
      getIO().emit('availableCategories', Object.keys(questionBank));
      updateAdmin();
    }
  });

  socket.on('adminDeleteCategory', (catName) => {
    const locale = NormalizeLocale(socket.data.adminQuestionLocale);
    refreshQuestionBank(locale);
    const questionBank = getQuestionBank(locale);
    if (questionBank[catName]) {
      delete questionBank[catName];
      setQuestionBank(questionBank, locale);
      saveQuestionsToFile(questionBank, locale);
      getIO().emit('availableCategories', Object.keys(questionBank));
      updateAdmin();
    }
  });

  socket.on('adminAddQuestion', ({ category, questionObj }) => {
    const locale = NormalizeLocale(socket.data.adminQuestionLocale);
    refreshQuestionBank(locale);
    const questionBank = getQuestionBank(locale);
    if (questionBank[category]) {
      questionBank[category].push(questionObj);
      setQuestionBank(questionBank, locale);
      saveQuestionsToFile(questionBank, locale);
      updateAdmin();
    }
  });

  socket.on('adminDeleteQuestion', ({ category, index }) => {
    const locale = NormalizeLocale(socket.data.adminQuestionLocale);
    refreshQuestionBank(locale);
    const questionBank = getQuestionBank(locale);
    if (questionBank[category] && questionBank[category][index]) {
      questionBank[category].splice(index, 1);
      setQuestionBank(questionBank, locale);
      saveQuestionsToFile(questionBank, locale);
      updateAdmin();
    }
  });

  socket.on('disconnect', () => {
    leave(socket);
  });
  socket.on('leaveRoom', () => {
    leave(socket);
  });
}
