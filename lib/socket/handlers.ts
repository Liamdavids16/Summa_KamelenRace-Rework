import type { Socket } from 'socket.io';
import { saveLeaderboard } from '@/lib/leaderboard';
import { normalizeThemeId } from '@/lib/themes';
import {
  getQuestionBank,
  refreshQuestionBank,
  saveQuestionsToFile,
  setQuestionBank,
} from '@/lib/questions';
import {
  ADMIN_PASSWORDS,
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

export function updateAdmin(): void {
  const bank = refreshQuestionBank();
  getIO()
    .to('admins')
    .emit('adminData', {
      rooms: getSafeRooms(),
      leaderboard: getLeaderboard(),
      questionBank: bank,
      settings: globalSettings,
    });
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

export function resetRoom(name: string): void {
  if (!rooms[name]) return;
  rooms[name].hasWinner = false;
  rooms[name].status = 'waiting';
  rooms[name].countdown = 10;
  rooms[name].countdownStarted = false;

  for (const id in rooms[name].players) {
    rooms[name].players[id].progress = 0;
    rooms[name].players[id].currentQuestion = getRandomQuestion(rooms[name].categories);
  }

  getIO()
    .to(name)
    .emit('backToLobby', { tijd: 10, creatorId: rooms[name].creatorId });
  getIO().to(name).emit('updateGame', rooms[name].players);
  broadcastLobbyUpdate(name);
}

export function leave(socket: Socket): void {
  const name = socket.data.roomId;
  if (name && rooms[name]) {
    const wasCreator = rooms[name].creatorId === socket.id;
    delete rooms[name].players[socket.id];

    if (Object.keys(rooms[name].players).length === 0) {
      if (rooms[name].timerId) clearInterval(rooms[name].timerId);
      delete rooms[name];
      broadcastRooms();
    } else {
      if (wasCreator) {
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

  socket.on('joinRoom', ({ playerName, roomName, categories }) => {
    if (!rooms[roomName]) {
      rooms[roomName] = {
        categories,
        players: {},
        hasWinner: false,
        status: 'waiting',
        countdown: 10,
        timerId: null,
        creatorId: socket.id,
        countdownStarted: false,
      };
      broadcastRooms();
    }
    const room = rooms[roomName];
    if (room.status === 'playing') return socket.emit('errorMessage', 'Race al bezig!');
    if (Object.keys(room.players).length >= globalSettings.maxPlayers)
      return socket.emit('errorMessage', `Kamer is vol! (Max ${globalSettings.maxPlayers})`);

    socket.join(roomName);
    socket.data.roomId = roomName;
    room.players[socket.id] = {
      id: socket.id,
      name: playerName,
      progress: 0,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
      currentQuestion: getRandomQuestion(room.categories),
    };

    const isCreator = room.creatorId === socket.id;
    socket.emit('settingsUpdated', globalSettings);
    getIO().to(roomName).emit('updateGame', room.players);
    socket.emit('waitingPhase', {
      tijd: room.countdown,
      categories: room.categories,
      isCreator,
      countdownStarted: room.countdownStarted,
    });
    broadcastLobbyUpdate(roomName);
    broadcastRooms();
    updateAdmin();
  });

  socket.on('creatorStartCountdown', () => {
    const room = rooms[socket.data.roomId ?? ''];
    if (!room || room.status !== 'waiting' || room.countdownStarted) return;
    if (room.creatorId !== socket.id) return;

    const currentCount = Object.keys(room.players).length;
    if (currentCount < 1) return;

    room.countdownStarted = true;
    const roomId = socket.data.roomId;
    if (roomId) {
      getIO().to(roomId).emit('countdownStarted', room.countdown);
      startTimer(roomId);
    }
    updateAdmin();
  });

  socket.on('submitAnswer', (idx) => {
    const roomId = socket.data.roomId;
    const room = roomId ? rooms[roomId] : undefined;
    if (!room || room.status !== 'playing' || room.hasWinner) return;
    const p = room.players[socket.id];
    if (!p) return;

    if (idx === p.currentQuestion.answer) {
      const step = 100 / globalSettings.questionsPerRound;
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
          setTimeout(() => resetRoom(roomId), 6000);
        }
      } else {
        p.currentQuestion = getRandomQuestion(room.categories);
        socket.emit('newQuestion', p.currentQuestion);
      }
    } else {
      socket.emit('errorMessage', 'Fout! Strafseconde... Je krijgt een nieuwe vraag.');
      p.currentQuestion = getRandomQuestion(room.categories);
      setTimeout(() => socket.emit('newQuestion', p.currentQuestion), 1500);
    }
    if (roomId) getIO().to(roomId).emit('updateGame', room.players);
  });

  socket.on('adminLogin', (pass) => {
    if (ADMIN_PASSWORDS.includes(pass)) {
      const questionBank = refreshQuestionBank();
      socket.join('admins');
      socket.emit('adminData', {
        rooms: getSafeRooms(),
        leaderboard: getLeaderboard(),
        questionBank,
        settings: globalSettings,
      });
    } else {
      socket.emit('adminError', 'Fout wachtwoord!');
    }
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
      if (rooms[name].timerId) clearInterval(rooms[name].timerId);
      getIO().to(name).emit('errorMessage', 'Kamer gesloten door admin.');
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
    getIO().emit('settingsUpdated', globalSettings);
    updateAdmin();
  });

  socket.on('adminAddCategory', (catName) => {
    refreshQuestionBank();
    const questionBank = getQuestionBank();
    if (!questionBank[catName]) {
      questionBank[catName] = [];
      setQuestionBank(questionBank);
      saveQuestionsToFile(questionBank);
      getIO().emit('availableCategories', Object.keys(questionBank));
      updateAdmin();
    }
  });

  socket.on('adminDeleteCategory', (catName) => {
    refreshQuestionBank();
    const questionBank = getQuestionBank();
    if (questionBank[catName]) {
      delete questionBank[catName];
      setQuestionBank(questionBank);
      saveQuestionsToFile(questionBank);
      getIO().emit('availableCategories', Object.keys(questionBank));
      updateAdmin();
    }
  });

  socket.on('adminAddQuestion', ({ category, questionObj }) => {
    refreshQuestionBank();
    const questionBank = getQuestionBank();
    if (questionBank[category]) {
      questionBank[category].push(questionObj);
      setQuestionBank(questionBank);
      saveQuestionsToFile(questionBank);
      updateAdmin();
    }
  });

  socket.on('adminDeleteQuestion', ({ category, index }) => {
    refreshQuestionBank();
    const questionBank = getQuestionBank();
    if (questionBank[category] && questionBank[category][index]) {
      questionBank[category].splice(index, 1);
      setQuestionBank(questionBank);
      saveQuestionsToFile(questionBank);
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
