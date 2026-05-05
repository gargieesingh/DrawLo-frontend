'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import socket from '../socket/socket';
import { useGame } from '../context/GameContext';

/**
 * Registers all server→client socket listeners.
 * Should be mounted once high in the tree (e.g. in the root layout).
 * Must be called AFTER the GameProvider wraps the tree.
 */
export function useGameEvents() {
  const { dispatch, addMessage } = useGame();
  const router = useRouter();

  useEffect(() => {
    // ── room_created ───────────────────────────────────────────────────────────
    function onRoomCreated({ code }) {
      dispatch({ type: 'SET_ROOM_CODE', code });
      router.push(`/lobby/${code}`);
    }

    // ── join_success ───────────────────────────────────────────────────────────
    function onJoinSuccess({ code }) {
      dispatch({ type: 'SET_ROOM_CODE', code });
      router.push(`/lobby/${code}`);
    }

    // ── join_error ─────────────────────────────────────────────────────────────
    function onJoinError({ message }) {
      dispatch({ type: 'SET_ERROR', message });
    }

    // ── room_update ────────────────────────────────────────────────────────────
    function onRoomUpdate(room) {
      dispatch({ type: 'ROOM_UPDATE', room });
    }

    // ── player_disconnected ────────────────────────────────────────────────────
    function onPlayerDisconnected({ name }) {
      addMessage({ id: 'system', name: '', text: `${name} left the game`, type: 'system' });
    }

    // ── your_turn_to_draw ──────────────────────────────────────────────────────
    function onYourTurnToDraw({ wordChoices }) {
      dispatch({ type: 'YOUR_TURN_TO_DRAW', wordChoices });
    }

    // ── turn_start ─────────────────────────────────────────────────────────────
    function onTurnStart({ drawerName, drawerID, round, totalRounds }) {
      dispatch({ type: 'TURN_START', drawerName, drawerID, round, totalRounds });
      addMessage({
        id: 'system',
        name: '',
        text: `${drawerName} is drawing!`,
        type: 'system',
      });

      // Only navigate to game page if player is in a lobby/game context, not if
      // they have already navigated home (which clears room code and disconnects).
      const currentCode = window.__drawlo_room_code__;
      const onHomePage = window.location.pathname === '/';
      if (currentCode && !onHomePage) router.push(`/game/${currentCode}`);
    }

    // ── your_word ──────────────────────────────────────────────────────────────
    function onYourWord({ word }) {
      dispatch({ type: 'YOUR_WORD', word });
    }

    // ── word_chosen ────────────────────────────────────────────────────────────
    function onWordChosen({ hint, wordLength }) {
      dispatch({ type: 'WORD_CHOSEN', hint, wordLength });
    }

    // ── hint_update ────────────────────────────────────────────────────────────
    function onHintUpdate({ hint }) {
      dispatch({ type: 'HINT_UPDATE', hint });
    }

    // ── timer_tick ─────────────────────────────────────────────────────────────
    function onTimerTick({ timeLeft }) {
      dispatch({ type: 'TIMER_TICK', timeLeft });
    }

    // ── correct_guess ──────────────────────────────────────────────────────────
    function onCorrectGuess({ playerId, playerName, score }) {
      addMessage({
        id: `correct-${playerId}-${Date.now()}`,
        name: playerName,
        text: `guessed the word! (+${score} pts)`,
        type: 'correct',
      });
    }

    // ── chat_message ───────────────────────────────────────────────────────────
    function onChatMessage({ id, name, text, type }) {
      addMessage({ id, name, text, type });
    }

    // ── turn_end ───────────────────────────────────────────────────────────────
    function onTurnEnd({ word, players }) {
      dispatch({ type: 'TURN_END', word, players });
    }

    // ── game_end ───────────────────────────────────────────────────────────────
    function onGameEnd({ players, winner }) {
      dispatch({ type: 'GAME_END', players, winner });
    }

    // ── game_aborted ───────────────────────────────────────────────────────────
    function onGameAborted({ reason }) {
      dispatch({ type: 'GAME_ABORTED', reason });
    }

    // ── you_guessed_correctly ───────────────────────────────────────────────────────
    function onYouGuessedCorrectly({ word }) {
      dispatch({ type: 'YOU_GUESSED_CORRECTLY', word });
    }

    // ── countdown_tick ────────────────────────────────────────────────────────────
    function onCountdownTick({ seconds }) {
      dispatch({ type: 'COUNTDOWN_TICK', seconds });
    }

    // ── countdown_cancelled ─────────────────────────────────────────────────────
    function onCountdownCancelled() {
      dispatch({ type: 'COUNTDOWN_CANCELLED' });
    }

    // ── draw_history ───────────────────────────────────────────────────────
    // Captured here (root layout level) so it is NEVER missed during page
    // navigation. Canvas.jsx reads state.drawHistory and replays on mount.
    function onDrawHistory(history) {
      dispatch({ type: 'SET_DRAW_HISTORY', history });
    }

    // ── disconnect / reconnect ────────────────────────────────────────────────
    function onDisconnect(reason) {
      dispatch({ type: 'SET_ERROR', message: 'Connection lost. Reconnecting...' });
    }

    function onConnect() {
      dispatch({ type: 'CLEAR_ERROR' });
    }

    socket.on('room_created', onRoomCreated);
    socket.on('join_success', onJoinSuccess);
    socket.on('join_error', onJoinError);
    socket.on('room_update', onRoomUpdate);
    socket.on('player_disconnected', onPlayerDisconnected);
    socket.on('your_turn_to_draw', onYourTurnToDraw);
    socket.on('turn_start', onTurnStart);
    socket.on('your_word', onYourWord);
    socket.on('word_chosen', onWordChosen);
    socket.on('hint_update', onHintUpdate);
    socket.on('timer_tick', onTimerTick);
    socket.on('correct_guess', onCorrectGuess);
    socket.on('chat_message', onChatMessage);
    socket.on('turn_end', onTurnEnd);
    socket.on('game_end', onGameEnd);
    socket.on('game_aborted', onGameAborted);
    socket.on('you_guessed_correctly', onYouGuessedCorrectly);
    socket.on('countdown_tick', onCountdownTick);
    socket.on('countdown_cancelled', onCountdownCancelled);
    socket.on('draw_history', onDrawHistory);
    socket.on('disconnect', onDisconnect);
    socket.on('connect', onConnect);

    return () => {
      socket.off('room_created', onRoomCreated);
      socket.off('join_success', onJoinSuccess);
      socket.off('join_error', onJoinError);
      socket.off('room_update', onRoomUpdate);
      socket.off('player_disconnected', onPlayerDisconnected);
      socket.off('your_turn_to_draw', onYourTurnToDraw);
      socket.off('turn_start', onTurnStart);
      socket.off('your_word', onYourWord);
      socket.off('word_chosen', onWordChosen);
      socket.off('hint_update', onHintUpdate);
      socket.off('timer_tick', onTimerTick);
      socket.off('correct_guess', onCorrectGuess);
      socket.off('chat_message', onChatMessage);
      socket.off('turn_end', onTurnEnd);
      socket.off('game_end', onGameEnd);
      socket.off('game_aborted', onGameAborted);
      socket.off('you_guessed_correctly', onYouGuessedCorrectly);
      socket.off('countdown_tick', onCountdownTick);
      socket.off('countdown_cancelled', onCountdownCancelled);
      socket.off('draw_history', onDrawHistory);
      socket.off('disconnect', onDisconnect);
      socket.off('connect', onConnect);
    };
  }, [dispatch, addMessage, router]);
}
