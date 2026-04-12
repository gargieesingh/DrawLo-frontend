'use strict';

// In-memory store for all active rooms
const rooms = {};

/**
 * Generates a random 5-character alphanumeric room code.
 * Retries if the code already exists.
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  do {
    code = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms[code]);
  return code;
}

/**
 * Creates a serializable snapshot of a room, stripping sensitive or
 * non-serializable fields (timer ref, currentWord).
 *
 * @param {object} room
 * @returns {object} Safe room object suitable for broadcasting
 */
function safeRoom(room) {
  return {
    code: room.code,
    host: room.host,
    players: room.players.map(p => ({ 
      id: p.id, 
      name: p.name, 
      avatar: p.avatar, // Include avatar
      score: p.score, 
      hasGuessed: p.hasGuessed, 
      isDrawing: p.isDrawing 
    })),
    settings: { ...room.settings },
    state: {
      status: room.state.status,
      round: room.state.round,
      drawerIndex: room.state.drawerIndex,
      currentDrawer: room.state.currentDrawer,
      currentWord: null,       // never expose word to clients
      wordChoices: [],          // never expose choices to clients
      timeLeft: room.state.timeLeft,
      timer: null,              // non-serializable — strip
      drawHistory: [],          // omit from updates; sent separately on join
    },
  };
}

/**
 * Creates a new room and returns it.
 *
 * @param {string} socketId  - Host's socket ID
 * @param {string} name      - Host's display name
 * @param {object} settings  - { maxPlayers, rounds, drawTime }
 * @returns {{ room: object, code: string }}
 */
function createRoom(socketId, name, settings) {
  const code = generateRoomCode();

  const room = {
    code,
    host: socketId,
    players: [
      { id: socketId, name, avatar: settings?.avatar || '🦁', score: 0, hasGuessed: false, isDrawing: false },
    ],
    settings: {
      maxPlayers: settings?.maxPlayers || 8,
      rounds: settings?.rounds || 3,
      drawTime: settings?.drawTime || 80,
    },
    state: {
      status: 'waiting',
      round: 0,
      drawerIndex: 0,
      currentDrawer: null,
      currentWord: null,
      wordChoices: [],
      timeLeft: 0,
      timer: null,
      drawHistory: [],
      usedWords: [],          // track words used this game session
      countdownTimer: null,   // interval ref for auto-start countdown
      countdownActive: false, // true while countdown is ticking
      recoveryMode: false,    // true when game was aborted and we're waiting for a rejoin
      recoveryTimer: null,    // timeout ref for the 20s recovery window
    },
  };

  rooms[code] = room;
  console.log(`[Room] Created: ${code} by ${name} (${socketId})`);
  return { room, code };
}

/**
 * Adds a player to an existing room.
 * Returns an error string if validation fails, or the room on success.
 *
 * @param {string} socketId
 * @param {string} name
 * @param {string} code
 * @returns {{ error: string }|{ room: object }}
 */
function joinRoom(socketId, name, code, avatar) {
  const room = rooms[code];

  if (!room) return { error: 'Room not found.' };
  if (room.players.length >= room.settings.maxPlayers) return { error: 'Room is full.' };
  if (room.players.find(p => p.id === socketId)) return { error: 'Already in room.' };

  room.players.push({ id: socketId, name, avatar: avatar || '🦁', score: 0, hasGuessed: false, isDrawing: false });

  console.log(`[Room] ${name} (${socketId}) joined ${code}`);
  return { room };
}

/**
 * Removes a player from their room on disconnect.
 * Returns metadata about what happened so the caller can react.
 *
 * @param {string} socketId
 * @returns {{ code: string, room: object|null, wasHost: boolean, wasDrawer: boolean, wasEmpty: boolean }|null}
 */
function removePlayer(socketId) {
  // Find which room this socket is in
  const code = Object.keys(rooms).find(c =>
    rooms[c].players.some(p => p.id === socketId)
  );
  if (!code) return null;

  const room = rooms[code];
  const playerIndex = room.players.findIndex(p => p.id === socketId);
  if (playerIndex === -1) return null;

  const playerName = room.players[playerIndex].name;
  const wasHost = room.host === socketId;
  const wasDrawer = room.state.currentDrawer === socketId;

  // Remove player
  room.players.splice(playerIndex, 1);

  // Adjust drawerIndex if a player who has already drawn (or is currently drawing) leaves.
  // This prevents skipping the next player in the sequence due to the array shift.
  if (playerIndex < room.state.drawerIndex) {
    room.state.drawerIndex = Math.max(0, room.state.drawerIndex - 1);
  }

  console.log(`[Room] ${playerName} (${socketId}) left ${code}. Players remaining: ${room.players.length}`);

  if (room.players.length === 0) {
    // Clean up empty room
    if (room.state.timer) clearInterval(room.state.timer);
    delete rooms[code];
    return { code, room: null, wasHost, wasDrawer, wasEmpty: true, playerName };
  }

  if (wasHost && room.players.length > 0) {
    // Assign next player as new host
    room.host = room.players[0].id;
    console.log(`[Room] New host: ${room.players[0].name} (${room.host}) in ${code}`);
  }

  return { code, room, wasHost, wasDrawer, wasEmpty: false, playerName };
}

/**
 * Retrieve a room by code.
 * @param {string} code
 * @returns {object|undefined}
 */
function getRoom(code) {
  return rooms[code];
}

/**
 * Finds the room code a socket is currently participating in.
 * @param {string} socketId
 * @returns {string|null}
 */
function findRoomBySocket(socketId) {
  return Object.keys(rooms).find(c =>
    rooms[c].players.some(p => p.id === socketId)
  ) || null;
}

/**
 * Finds the first available public room for matchmaking:
 *   - Room is not full AND players < 4 (matchmaking cap)
 *   - Status is not 'gameEnd' (allow mid-game joins)
 *   - Code is not equal to ignoreCode
 *
 * @param {string} [ignoreCode] Optional room code to ignore
 * @returns {object|null} The room object, or null if none found.
 */
function findAvailableRoom(ignoreCode) {
  return Object.values(rooms).find(
    r => r.code !== ignoreCode && r.state.status !== 'gameEnd' && r.players.length < Math.min(4, r.settings.maxPlayers)
  ) || null;
}

/**
 * Resets a room back to a fresh 'waiting' state so the game can be restarted.
 * Scores, flags, and game state are all wiped. The room itself (players, host,
 * settings, code) is preserved.
 *
 * @param {string} code
 * @returns {object|null} The reset room, or null if not found.
 */
function resetRoomForRestart(code) {
  const room = rooms[code];
  if (!room) return null;

  // Clear any running timer
  if (room.state.timer) {
    clearInterval(room.state.timer);
    room.state.timer = null;
  }

  // Reset all player scores and turn flags
  room.players.forEach(p => {
    p.score = 0;
    p.hasGuessed = false;
    p.isDrawing = false;
  });

  // Reset game state
  room.state.status = 'waiting';
  room.state.round = 0;
  room.state.drawerIndex = 0;
  room.state.currentDrawer = null;
  room.state.currentWord = null;
  room.state.wordChoices = [];
  room.state.timeLeft = 0;
  room.state.drawHistory = [];
  room.state.usedWords = [];
  room.state.recoveryMode = false;
  room.state.recoveryTimer = null;

  console.log(`[Room] Reset for restart: ${code}`);
  return room;
}

module.exports = { rooms, createRoom, joinRoom, removePlayer, getRoom, findRoomBySocket, safeRoom, resetRoomForRestart, findAvailableRoom };
