'use strict';

const { words: wordList } = require('./data/words');
const { calculateDrawerScore } = require('./scoreManager');
const { getRoom, safeRoom } = require('./gameManager');

// ─── Hint helpers ──────────────────────────────────────────────────────────────

/**
 * Returns a masked version of the word: letters become '_', spaces preserved.
 * e.g. "hot dog" → "_ _ _   _ _ _"
 */
function getHint(word) {
  return word
    .split('')
    .map(ch => (ch === ' ' ? '  ' : '_'))
    .join(' ')
    .replace(/  /g, '   '); // triple space for word boundaries
}

/**
 * Progressively reveals letters as time runs out (up to ~40% of letter chars).
 * Never reveals the first or last character of the full word.
 *
 * @param {string}   word
 * @param {number}   timeLeft
 * @param {number}   totalTime
 * @param {number[]} revealedIndices - Array tracking which indices have been shown
 * @returns {{ hint: string, revealedIndices: number[] }}
 */
function getProgressiveHint(word, timeLeft, totalTime, revealedIndices = []) {
  const letters = word.split('');
  // Eligible positions: not first, not last, not a space
  const eligible = letters
    .map((ch, i) => ({ ch, i }))
    .filter(({ ch, i }) => ch !== ' ' && i !== 0 && i !== word.length - 1)
    .map(({ i }) => i);

  const maxReveal = Math.floor(eligible.length * 0.4);
  const elapsed = totalTime - timeLeft;
  // How many letters should be revealed by now
  const targetCount = Math.min(
    Math.floor((elapsed / totalTime) * maxReveal),
    eligible.length
  );

  // Add new indices if needed
  const newRevealed = [...revealedIndices];
  while (newRevealed.length < targetCount) {
    const remaining = eligible.filter(i => !newRevealed.includes(i));
    if (remaining.length === 0) break;
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    newRevealed.push(pick);
  }

  // Build the hint string
  const hint = letters
    .map((ch, i) => {
      if (ch === ' ') return '  ';
      if (i === 0 || i === word.length - 1) return '_';
      return newRevealed.includes(i) ? ch : '_';
    })
    .join(' ')
    .replace(/  /g, '   ');

  return { hint, revealedIndices: newRevealed };
}

// ─── Game flow ─────────────────────────────────────────────────────────────────

/**
 * Kicks off a new game for the given room.
 */
function startGame(io, code) {
  const room = getRoom(code);
  if (!room) return;

  room.state.round = 1;
  room.state.drawerIndex = 0;
  room.state.status = 'waiting';
  room.state.usedWords = [];

  console.log(`[Game] Starting game in room ${code}`);
  nextTurn(io, code);
}

/**
 * Advances to the next turn — increments round when all players have drawn.
 * Ends the game when rounds are exhausted.
 */
function nextTurn(io, code) {
  const room = getRoom(code);
  if (!room) return;

  // Clear any leftover timer
  if (room.state.timer) {
    clearInterval(room.state.timer);
    room.state.timer = null;
  }

  // If all players have drawn this round, advance the round
  if (room.state.drawerIndex >= room.players.length) {
    room.state.round++;
    room.state.drawerIndex = 0;
  }

  // Check if game is over
  if (room.state.round > room.settings.rounds) {
    endGame(io, code);
    return;
  }

  const drawer = room.players[room.state.drawerIndex];
  if (!drawer) {
    endGame(io, code);
    return;
  }

  // Reset player states for this turn
  room.players.forEach(p => {
    p.hasGuessed = false;
    p.isDrawing = false;
  });
  drawer.isDrawing = true;

  room.state.currentDrawer = drawer.id;
  room.state.status = 'picking';
  room.state.currentWord = null;
  room.state.drawHistory = [];
  room.state.revealedIndices = [];
  room.state.drawerIndex++;

  // Clear the frontend canvas explicitly for all clients 
  // before the new drawer starts picking a word
  io.to(code).emit('clear_canvas');

  // Pick unique words from the pool
  const customWords = room.settings.customWords && room.settings.customWords.length > 0 ? room.settings.customWords : null;
  const pool = customWords || wordList;

  let available = pool.filter(w => !(room.state.usedWords || []).includes(w));
  
  // If all pool words are exhausted, reset the pool for further turns
  if (available.length === 0) {
    available = [...pool];
    room.state.usedWords = (room.state.usedWords || []).filter(w => !pool.includes(w));
  }

  const shuffled = available.sort(() => Math.random() - 0.5);
  const choices = shuffled.slice(0, 3);
  room.state.wordChoices = choices;

  console.log(`[Turn] Round ${room.state.round}/${room.settings.rounds} — Drawer: ${drawer.name} (${drawer.id})`);

  // Notify drawer privately
  io.to(drawer.id).emit('your_turn_to_draw', { wordChoices: choices });

  // Notify room
  io.to(code).emit('turn_start', {
    drawerName: drawer.name,
    drawerID: drawer.id,
    round: room.state.round,
    totalRounds: room.settings.rounds,
  });

  io.to(code).emit('room_update', safeRoom(room));

  io.to(code).emit('room_update', safeRoom(room));

  startPickingTimer(io, code);
}

/**
 * Starts a 30s countdown timer for the drawer to pick a word.
 */
function startPickingTimer(io, code) {
  const room = getRoom(code);
  if (!room) return;

  if (room.state.timer) {
    clearInterval(room.state.timer);
  }

  room.state.timeLeft = 30; // 30 seconds to pick

  room.state.timer = setInterval(() => {
    const r = getRoom(code);
    if (!r) { clearInterval(room.state.timer); return; }

    r.state.timeLeft--;
    io.to(code).emit('timer_tick', { timeLeft: r.state.timeLeft });

    if (r.state.timeLeft <= 0) {
      clearInterval(r.state.timer);
      r.state.timer = null;
      
      const autoWord = r.state.wordChoices[0] || 'unknown';
      console.log(`[Turn] Time ran out. Auto-picking word "${autoWord}" for ${r.state.currentDrawer}`);
      startDrawingPhase(io, code, autoWord);
    }
  }, 1000);
}

/**
 * Called when drawer emits 'pick_word'. Transitions to drawing phase.
 */
function startDrawingPhase(io, code, word) {
  const room = getRoom(code);
  if (!room) return;

  // Clear picking timer
  if (room.state.timer) {
    clearInterval(room.state.timer);
    room.state.timer = null;
  }

  room.state.currentWord = word;
  room.state.status = 'drawing';
  room.state.revealedIndices = [];

  // Track used word
  if (!room.state.usedWords) room.state.usedWords = [];
  room.state.usedWords.push(word);

  console.log(`[Turn] Word picked in ${code}: "${word}"`);

  // Tell room the hint + word length
  io.to(code).emit('word_chosen', {
    hint: getHint(word),
    wordLength: word.length,
  });

  // Tell ONLY the drawer the actual word
  io.to(room.state.currentDrawer).emit('your_word', { word });

  io.to(code).emit('room_update', safeRoom(room));

  startTurnTimer(io, code);
}

/**
 * Starts the countdown timer for the drawing phase.
 */
function startTurnTimer(io, code) {
  const room = getRoom(code);
  if (!room) return;

  // Clear any existing timer
  if (room.state.timer) {
    clearInterval(room.state.timer);
    room.state.timer = null;
  }

  room.state.timeLeft = room.settings.drawTime;

  room.state.timer = setInterval(() => {
    const r = getRoom(code);
    if (!r) { clearInterval(room.state.timer); return; }

    r.state.timeLeft--;

    // Emit tick
    io.to(code).emit('timer_tick', { timeLeft: r.state.timeLeft });

    // Progressive hint reveal (recalculate every second)
    if (r.state.currentWord) {
      const { hint, revealedIndices } = getProgressiveHint(
        r.state.currentWord,
        r.state.timeLeft,
        r.settings.drawTime,
        r.state.revealedIndices || []
      );
      r.state.revealedIndices = revealedIndices;
      io.to(code).emit('hint_update', { hint });
    }

    if (r.state.timeLeft <= 0) {
      endTurn(io, code);
    }
  }, 1000);
}

/**
 * Ends the current drawing turn, awards points, and schedules the next turn.
 */
function endTurn(io, code) {
  const room = getRoom(code);
  if (!room) return;

  // Prevent double-ending
  if (room.state.status === 'turnEnd' || room.state.status === 'gameEnd') return;

  // Clear timers
  if (room.state.timer) {
    clearInterval(room.state.timer);
    room.state.timer = null;
  }

  // If the drawer left during picking, the word might be null
  if (!room.state.currentWord && room.state.status === 'picking') {
    room.state.currentWord = '(Skipped)';
  }

  room.state.status = 'turnEnd';

  // Award drawer bonus
  const guessedCount = room.players.filter(
    p => p.id !== room.state.currentDrawer && p.hasGuessed
  ).length;
  const drawerBonus = calculateDrawerScore(guessedCount);

  const drawer = room.players.find(p => p.id === room.state.currentDrawer);
  if (drawer) drawer.score += drawerBonus;

  console.log(`[Turn] Turn ended in ${code}. Word: "${room.state.currentWord}". Guessed: ${guessedCount}. Drawer bonus: ${drawerBonus}`);

  io.to(code).emit('turn_end', {
    word: room.state.currentWord,
    players: room.players.map(p => ({ ...p })),
  });

  io.to(code).emit('room_update', safeRoom(room));

  // Wait 4 seconds then continue
  setTimeout(() => {
    const r = getRoom(code);
    if (r && r.state.status === 'turnEnd') {
      nextTurn(io, code);
    }
  }, 4000);
}

/**
 * Ends the game, sorts players by score, and announces a winner.
 */
function endGame(io, code) {
  const room = getRoom(code);
  if (!room) return;

  if (room.state.timer) {
    clearInterval(room.state.timer);
    room.state.timer = null;
  }

  room.state.status = 'gameEnd';

  const sorted = [...room.players].sort((a, b) => b.score - a.score);

  console.log(`[Game] Game over in ${code}. Winner: ${sorted[0]?.name}`);

  io.to(code).emit('game_end', {
    players: sorted,
    winner: sorted[0] || null,
  });

  io.to(code).emit('room_update', safeRoom(room));

  // We no longer automatically reset to waiting state here.
  // Players must actively click 'Play Again' or 'Exit' in the UI dialog.
}

module.exports = {
  startGame,
  nextTurn,
  startDrawingPhase,
  startTurnTimer,
  endTurn,
  endGame,
  getHint,
  getProgressiveHint,
};
