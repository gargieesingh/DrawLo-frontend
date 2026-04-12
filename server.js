'use strict';

require('dotenv').config();

const express = require('express');
const http = require('http');
const next = require('next');
const { Server } = require('socket.io');
const cors = require('cors');

const { createRoom, joinRoom, removePlayer, getRoom, findRoomBySocket, safeRoom, resetRoomForRestart, findAvailableRoom } = require('./server/gameManager');
const { startGame, endTurn, startDrawingPhase, getHint } = require('./server/turnManager');
const { calculateGuesserScore } = require('./server/scoreManager');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  // ─── Express + HTTP setup ──────────────────────────────────────────────────────

  const app = express();
  const server = http.createServer(app);

  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  // Let Next.js handle all remaining requests including /
  app.use((req, res) => {
    return handle(req, res);
  });

  // ─── Socket.io setup ───────────────────────────────────────────────────────────

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ['GET', 'POST'],
    },
  });

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Finds the room code for a connected socket.
 * Returns null if the socket isn't in any room.
 */
function getRoomCode(socket) {
  // socket.rooms includes the socket's own ID as first entry
  const rooms = [...socket.rooms].filter(r => r !== socket.id);
  return rooms[0] || null;
}

// ─── Countdown helpers ─────────────────────────────────────────────────────────

const COUNTDOWN_SECONDS = 10;   // auto-start countdown duration
const MIN_PLAYERS_FOR_AUTO = 2; // minimum players to trigger countdown

/**
 * Starts a countdown for the room. When it hits 0 the game begins automatically.
 * Safe to call even if a countdown is already running (it won't create duplicates).
 */
function startCountdown(io, code) {
  const room = getRoom(code);
  if (!room || room.state.countdownActive) return;

  let seconds = COUNTDOWN_SECONDS;
  room.state.countdownActive = true;

  // Emit the initial tick immediately so the UI shows the first number at once
  io.to(code).emit('countdown_tick', { seconds });

  room.state.countdownTimer = setInterval(() => {
    const r = getRoom(code);
    if (!r) { clearInterval(room.state.countdownTimer); return; }

    seconds--;
    io.to(code).emit('countdown_tick', { seconds });

    if (seconds <= 0) {
      clearInterval(r.state.countdownTimer);
      r.state.countdownTimer = null;
      r.state.countdownActive = false;
      console.log(`[Countdown] Auto-starting game in room ${code}`);
      startGame(io, code);
    }
  }, 1000);

  console.log(`[Countdown] Started in room ${code}`);
}

/**
 * Cancels an active countdown and notifies all clients.
 */
function cancelCountdown(io, code) {
  const room = getRoom(code);
  if (!room || !room.state.countdownActive) return;

  clearInterval(room.state.countdownTimer);
  room.state.countdownTimer = null;
  room.state.countdownActive = false;

  io.to(code).emit('countdown_cancelled');
  console.log(`[Countdown] Cancelled in room ${code}`);
}

/**
 * Checks whether the countdown should start or stop based on current player count.
 * Called after any player joins or leaves a waiting room.
 */
function checkCountdown(io, code) {
  const room = getRoom(code);
  if (!room || room.state.status !== 'waiting') return;

  if (room.players.length >= MIN_PLAYERS_FOR_AUTO) {
    cancelCountdown(io, code); // Ensure UI clears any stale states
    console.log(`[Game] Auto-starting game instantly in room ${code}`);
    startGame(io, code);
  } else {
    cancelCountdown(io, code);
  }
}

/**
 * Enters recovery mode for a room when a game ends with only 1 player left.
 * Waits RECOVERY_SECONDS for a 2nd player to join; if they do, the game
 * restarts automatically. After the window expires, recovery mode is cleared.
 */
const RECOVERY_SECONDS = 20;

function startRecovery(io, code) {
  const room = getRoom(code);
  if (!room) return;

  room.state.recoveryMode = true;
  console.log(`[Recovery] Room ${code} entered recovery mode (${RECOVERY_SECONDS}s window)`);

  room.state.recoveryTimer = setTimeout(() => {
    const r = getRoom(code);
    if (r && r.state.recoveryMode) {
      r.state.recoveryMode = false;
      r.state.recoveryTimer = null;
      console.log(`[Recovery] Room ${code} recovery window expired — staying in waiting`);
    }
  }, RECOVERY_SECONDS * 1000);
}

/**
 * Checks if a room is in recovery mode with enough players to restart.
 * Call this after any player joins. Returns true if a restart was triggered.
 */
function checkRecovery(io, code) {
  const room = getRoom(code);
  if (!room || !room.state.recoveryMode || room.players.length < 2) return false;

  // Cancel the recovery timeout
  clearTimeout(room.state.recoveryTimer);
  room.state.recoveryTimer = null;

  console.log(`[Recovery] 2nd player joined ${code} — auto-restarting game`);
  resetRoomForRestart(code);
  startGame(io, code);
  return true;
}

/**
 * Evaluates whether to restart the room or matchmake isolated players after a game ends.
 */
function checkPlayAgain(io, code) {
  const room = getRoom(code);
  if (!room || room.state.status !== 'gameEnd') return;

  const playAgainPlayers = room.players.filter(p => p.wantsToPlayAgain);
  const readyCount = playAgainPlayers.length;

  if (readyCount >= 2) {
    console.log(`[Game] ${readyCount} players want to play again in ${code}. Auto-restarting.`);
    room.players.forEach(p => delete p.wantsToPlayAgain);
    
    // resetRoomForRestart wipes game status to waiting.
    const resetRoom = resetRoomForRestart(code);
    io.to(code).emit('room_update', safeRoom(resetRoom));
    startGame(io, code);
  } else if (room.players.length === 1 && readyCount === 1) {
    const player = playAgainPlayers[0];
    const targetRoom = findAvailableRoom(code);
    const socketToMove = io.sockets.sockets.get(player.id);
    
    if (targetRoom) {
      console.log(`[Event] Matchmaking isolated player ${player.name} from ${code} to ${targetRoom.code}`);
      const targetCode = targetRoom.code;
      
      if (socketToMove) socketToMove.leave(code);
      removePlayer(player.id);

      const joinRes = joinRoom(player.id, player.name, targetCode, player.avatar);
      if (joinRes.error && socketToMove) {
        socketToMove.emit('join_error', { message: joinRes.error });
      } else if (socketToMove) {
        socketToMove.join(targetCode);
        socketToMove.emit('join_success', { code: targetCode });
        io.to(targetCode).emit('room_update', safeRoom(joinRes.room));

        if (joinRes.room.state.drawHistory && joinRes.room.state.drawHistory.length > 0) {
          socketToMove.emit('draw_history', joinRes.room.state.drawHistory);
        }
        if (joinRes.room.state.status === 'drawing' && joinRes.room.state.currentWord) {
          socketToMove.emit('word_chosen', {
            hint: getHint(joinRes.room.state.currentWord),
            wordLength: joinRes.room.state.currentWord.length,
          });
        }
        if (!checkRecovery(io, targetCode)) {
          checkCountdown(io, targetCode);
        }
      }
    } else {
      console.log(`[Event] Isolated player ${player.name} in ${code} creating new matchmade room.`);
      if (socketToMove) {
        socketToMove.leave(code);
        removePlayer(player.id);
        const created = createRoom(player.id, player.name, { avatar: player.avatar, maxPlayers: 4 });
        socketToMove.join(created.code);
        socketToMove.emit('join_success', { code: created.code });
        io.to(created.code).emit('room_update', safeRoom(created.room));
      }
    }
  }
}

// ─── Socket event handlers ─────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ── create_room ─────────────────────────────────────────────────────────────
  socket.on('create_room', ({ name, settings, avatar } = {}) => {
    if (!name || typeof name !== 'string' || !name.trim()) {
      return socket.emit('join_error', { message: 'A display name is required.' });
    }

    const existingCode = findRoomBySocket(socket.id);
    if (existingCode) {
      return socket.emit('room_created', { code: existingCode });
    }

    const { code, room } = createRoom(socket.id, name.trim(), { ...settings, avatar });
    socket.join(code);
    socket.emit('room_created', { code });
    io.to(code).emit('room_update', safeRoom(room));
    console.log(`[Event] create_room → code=${code}, host="${name}"`);
  });

  // ── join_room ────────────────────────────────────────────────────────────────
  socket.on('join_room', ({ name, code, avatar } = {}) => {
    if (!name || !code) {
      return socket.emit('join_error', { message: 'Name and room code are required.' });
    }

    const result = joinRoom(socket.id, name.trim(), code.toUpperCase(), avatar);
    if (result.error) {
      return socket.emit('join_error', { message: result.error });
    }

    const { room } = result;
    socket.join(code.toUpperCase());
    socket.emit('join_success', { code: room.code });

    // Send existing draw history to late joiner
    if (room.state.drawHistory.length > 0) {
      socket.emit('draw_history', room.state.drawHistory);
    }

    // If game is in progress, send current hint
    if (room.state.status === 'drawing' && room.state.currentWord) {
      socket.emit('word_chosen', {
        hint: getHint(room.state.currentWord),
        wordLength: room.state.currentWord.length,
      });
    }

    io.to(room.code).emit('room_update', safeRoom(room));
    console.log(`[Event] join_room → "${name}" joined ${room.code}`);
    // ── Recovery: if this room is waiting for a rejoin, auto-restart ──────────
    if (!checkRecovery(io, room.code)) {
      checkCountdown(io, room.code);
    }
  });

  // ── start_game ───────────────────────────────────────────────────────────────
  socket.on('start_game', () => {
    const code = getRoomCode(socket);
    if (!code) return;

    const room = getRoom(code);
    if (!room) return;

    if (room.host !== socket.id) {
      return socket.emit('join_error', { message: 'Only the host can start the game.' });
    }
    
    // Matchmaking override: if alone and host clicks start, try to join an active lobby
    if (room.players.length < 2) {
      const targetRoom = findAvailableRoom(code);
      
      if (targetRoom) {
        const player = room.players.find(p => p.id === socket.id);
        const playerName = player.name;
        const targetCode = targetRoom.code;

        console.log(`[Event] start_game (matchmake) → moving ${playerName} from ${code} to ${targetCode}`);

        // Leave current empty room
        const removeRes = removePlayer(socket.id);
        if (removeRes && !removeRes.wasEmpty) {
          io.to(removeRes.code).emit('player_disconnected', { name: playerName });
          io.to(removeRes.code).emit('room_update', safeRoom(removeRes.room));
        }

        socket.leave(code);

        // Join target room
        const joinRes = joinRoom(socket.id, playerName, targetCode);
        if (joinRes.error) {
          socket.emit('join_error', { message: joinRes.error });
        } else {
          socket.join(targetCode);
          // Only send join_success to this user to redirect them locally to the new code
          socket.emit('join_success', { code: targetCode });
          
          io.to(targetCode).emit('room_update', safeRoom(joinRes.room));

          // Send existing draw history to late joiner
          if (joinRes.room.state.drawHistory && joinRes.room.state.drawHistory.length > 0) {
            socket.emit('draw_history', joinRes.room.state.drawHistory);
          }

          // If game is in progress, send current hint
          if (joinRes.room.state.status === 'drawing' && joinRes.room.state.currentWord) {
            socket.emit('word_chosen', {
              hint: getHint(joinRes.room.state.currentWord),
              wordLength: joinRes.room.state.currentWord.length,
            });
          }
          
          if (!checkRecovery(io, targetCode)) {
            checkCountdown(io, targetCode);
          }
        }
      } else {
        // No room available
        socket.emit('no_user_found');
        socket.emit('chat_message', {
          id: 'system',
          name: 'System',
          text: 'Searching for an active lobby... currently none available.',
          type: 'chat'
        });
      }
      return;
    }

    if (room.state.status !== 'waiting') {
      return socket.emit('join_error', { message: 'Game is already in progress.' });
    }

    console.log(`[Event] start_game → room ${code}`);
    startGame(io, code);
  });

  // ── quick_play ────────────────────────────────────────────────────────────────
  socket.on('quick_play', ({ name, avatar } = {}) => {
    if (!name || typeof name !== 'string' || !name.trim()) {
      return socket.emit('join_error', { message: 'A display name is required.' });
    }

    // Try to find an existing open room first
    let room = findAvailableRoom();
    let code;

    if (room) {
      // Join the existing room
      code = room.code;
      const result = joinRoom(socket.id, name.trim(), code, avatar);
      if (result.error) {
        if (result.error === 'Already in room.') {
           // Emitted twice, just confirm they joined and return early
           return socket.emit('join_success', { code });
        }
        // Race condition: room filled up between find and join — create a new one
        const created = createRoom(socket.id, name.trim(), { avatar, maxPlayers: 4 });
        code = created.code;
        room = created.room;
      } else {
        room = result.room;
      }
    } else {
      // No available room — create a fresh one
      const created = createRoom(socket.id, name.trim(), { avatar, maxPlayers: 4 });
      code = created.code;
      room = created.room;
    }

    socket.join(code);
    socket.emit('join_success', { code });
    io.to(code).emit('room_update', safeRoom(room));

    // Send existing draw history to late joiner
    if (room.state.drawHistory && room.state.drawHistory.length > 0) {
      socket.emit('draw_history', room.state.drawHistory);
    }

    // If game is in progress, send current hint
    if (room.state.status === 'drawing' && room.state.currentWord) {
      socket.emit('word_chosen', {
        hint: getHint(room.state.currentWord),
        wordLength: room.state.currentWord.length,
      });
    }

    console.log(`[Event] quick_play → "${name}" joined room ${code}`);
    // ── Recovery: if this room is waiting for a rejoin, auto-restart ──────────
    if (!checkRecovery(io, code)) {
      checkCountdown(io, code);
    }
  });

  // ── restart_game ─────────────────────────────────────────────────────────────
  socket.on('restart_game', () => {
    const code = getRoomCode(socket);
    if (!code) return;

    const room = getRoom(code);
    if (!room) return;

    if (room.host !== socket.id) {
      return socket.emit('join_error', { message: 'Only the host can restart the game.' });
    }
    if (room.state.status !== 'gameEnd') {
      return socket.emit('join_error', { message: 'Game is not over yet.' });
    }
    if (room.players.length < 2) {
      return socket.emit('join_error', { message: 'At least 2 players are needed to restart.' });
    }

    console.log(`[Event] restart_game → room ${code}`);
    const resetRoom = resetRoomForRestart(code);
    // Broadcast the reset state to all clients (clears their gameEnd overlay)
    io.to(code).emit('room_update', safeRoom(resetRoom));
    // Immediately kick off a fresh game
    startGame(io, code);
  });

  // ── update_custom_words ──────────────────────────────────────────────────────
  socket.on('update_custom_words', ({ customWords } = {}) => {
    const code = getRoomCode(socket);
    if (!code) return;

    const room = getRoom(code);
    if (!room) return;

    if (room.host !== socket.id) {
      return; // Only host can update custom words
    }

    if (Array.isArray(customWords)) {
      room.settings.customWords = customWords.filter(w => typeof w === 'string' && w.trim().length > 0);
      io.to(code).emit('room_update', safeRoom(room));
      console.log(`[Event] update_custom_words → room ${code} set ${room.settings.customWords.length} custom words.`);
    }
  });

  // ── pick_word ────────────────────────────────────────────────────────────────
  socket.on('pick_word', ({ word } = {}) => {
    const code = getRoomCode(socket);
    if (!code) return;

    const room = getRoom(code);
    if (!room) return;

    if (room.state.currentDrawer !== socket.id) {
      return; // Only current drawer can pick
    }
    if (room.state.status !== 'picking') {
      return; // Must be in picking phase
    }
    if (!room.state.wordChoices.includes(word)) {
      return; // Word must be from the offered choices
    }

    console.log(`[Event] pick_word → "${word}" in room ${code}`);
    startDrawingPhase(io, code, word);
  });

  // ── draw ─────────────────────────────────────────────────────────────────────
  socket.on('draw', (data) => {
    const code = getRoomCode(socket);
    if (!code) return;

    const room = getRoom(code);
    if (!room) return;

    if (room.state.currentDrawer !== socket.id) return;
    if (room.state.status !== 'drawing') return;

    // Persist for late joiners
    room.state.drawHistory.push(data);

    // Relay to all other clients in the room
    socket.to(code).emit('draw', data);
  });

  // ── clear_canvas ─────────────────────────────────────────────────────────────
  socket.on('clear_canvas', () => {
    const code = getRoomCode(socket);
    if (!code) return;

    const room = getRoom(code);
    if (!room) return;

    if (room.state.currentDrawer !== socket.id) return;

    room.state.drawHistory = [];
    io.to(code).emit('clear_canvas');
    console.log(`[Event] clear_canvas → room ${code}`);
  });

  // ── guess ─────────────────────────────────────────────────────────────────────
  socket.on('guess', ({ text } = {}) => {
    const code = getRoomCode(socket);
    if (!code) return;

    const room = getRoom(code);
    if (!room) return;

    if (room.state.status !== 'drawing') return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    // Drawer cannot guess their own word
    if (room.state.currentDrawer === socket.id) return;

    // Already guessed
    if (player.hasGuessed) return;

    const guessText = (text || '').trim();
    const isCorrect = guessText.toLowerCase() === (room.state.currentWord || '').toLowerCase();

    if (isCorrect) {
      player.hasGuessed = true;
      const score = calculateGuesserScore(room.state.timeLeft, room.settings.drawTime);
      player.score += score;

      console.log(`[Guess] CORRECT — ${player.name} guessed "${room.state.currentWord}" in ${code} (+${score} pts)`);

      io.to(code).emit('correct_guess', {
        playerId: player.id,
        playerName: player.name,
        score,
      });

      // Notify the specific player of the word
      io.to(socket.id).emit('you_guessed_correctly', {
        word: room.state.currentWord
      });

      io.to(code).emit('room_update', safeRoom(room));

      // Check if all non-drawers have guessed
      const nonDrawers = room.players.filter(p => p.id !== room.state.currentDrawer);
      const allGuessed = nonDrawers.length > 0 && nonDrawers.every(p => p.hasGuessed);
      if (allGuessed) {
        console.log(`[Game] All players guessed in ${code} — ending turn early`);
        endTurn(io, code);
      }
    } else {
      // Broadcast wrong guess as a chat message
      io.to(code).emit('chat_message', {
        id: socket.id,
        name: player.name,
        text: guessText,
        type: 'guess',
      });
    }
  });

  // ── chat_message ─────────────────────────────────────────────────────────────
  socket.on('chat_message', ({ text } = {}) => {
    const code = getRoomCode(socket);
    if (!code) return;

    const room = getRoom(code);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const msgText = (text || '').trim();
    if (!msgText) return;

    io.to(code).emit('chat_message', {
      id: socket.id,
      name: player.name,
      text: msgText,
      type: 'chat',
    });
  });

  function handleSocketDisconnect(socketId) {
    const result = removePlayer(socketId);
    if (!result) return; // Player wasn't in any room

    const { code, room, wasDrawer, wasEmpty, playerName } = result;

    if (wasEmpty) {
      console.log(`[Room] Room ${code} deleted (empty)`);
      return;
    }

    io.to(code).emit('player_disconnected', { name: playerName });
    io.to(code).emit('room_update', safeRoom(room));

    if (room.players.length < 2 && room.state.status !== 'waiting' && room.state.status !== 'gameEnd') {
      console.log(`[Game] Only 1 player left in ${code} — aborting game, entering recovery mode`);
      if (room.state.timer) { clearInterval(room.state.timer); room.state.timer = null; }
      cancelCountdown(io, code);
      room.state.status = 'waiting';
      room.state.round = 0;
      room.state.drawerIndex = 0;
      room.state.currentDrawer = null;
      room.state.currentWord = null;
      room.players.forEach(p => { p.score = 0; p.hasGuessed = false; p.isDrawing = false; });
      io.to(code).emit('room_update', safeRoom(room));
      io.to(code).emit('game_aborted', { reason: 'Not enough players to continue.' });
      startRecovery(io, code);
      return;
    }

    if (room.state.status === 'gameEnd') {
      checkPlayAgain(io, code);
    }

    checkCountdown(io, code);

    if (wasDrawer && (room.state.status === 'drawing' || room.state.status === 'picking')) {
      console.log(`[Game] Drawer disconnected in ${code} — ending turn`);
      endTurn(io, code);
    }
  }

  // ── play_again_intent ────────────────────────────────────────────────────────
  socket.on('play_again_intent', () => {
    const code = getRoomCode(socket);
    if (!code) return;
    const room = getRoom(code);
    if (!room) return;
    
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.wantsToPlayAgain = true;
      checkPlayAgain(io, code);
    }
  });

  // ── leave_room ───────────────────────────────────────────────────────────────
  socket.on('leave_room', () => {
    handleSocketDisconnect(socket.id);
    socket.rooms.forEach(r => { if(r !== socket.id) socket.leave(r); });
  });

  // ── disconnect ────────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    handleSocketDisconnect(socket.id);
  });
});

// ─── Start server ──────────────────────────────────────────────────────────────

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> DrawLo unified server listening on http://localhost:${PORT}`);
  });
});
