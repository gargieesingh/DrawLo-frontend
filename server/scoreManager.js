'use strict';

/**
 * Calculates the guesser's score based on how much time is remaining.
 * First to guess: ~300pts (most time left), Last to guess: ~100pts (least time left).
 *
 * @param {number} timeLeft   - Seconds remaining on the timer
 * @param {number} drawTime   - Total seconds allowed for the turn
 * @returns {number} Score clamped between 100 and 300
 */
function calculateGuesserScore(timeLeft, drawTime) {
  const raw = Math.round(100 + (timeLeft / drawTime) * 200);
  return Math.max(100, Math.min(300, raw));
}

/**
 * Calculates the drawer's bonus at the end of a turn.
 * 50 points per player who guessed correctly, capped at 150.
 *
 * @param {number} guessedCount - Number of players who guessed correctly
 * @returns {number} Drawer bonus (0, 50, 100, or 150)
 */
function calculateDrawerScore(guessedCount) {
  return Math.min(guessedCount * 50, 150);
}

module.exports = { calculateGuesserScore, calculateDrawerScore };
