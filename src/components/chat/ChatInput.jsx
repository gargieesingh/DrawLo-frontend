'use client';

import { useState } from 'react';
import socket from '../../socket/socket';
import { useGame } from '../../context/GameContext';

export default function ChatInput() {
  const { state } = useGame();
  const { gameStatus, isMyTurn, guessedWord } = state;
  const [text, setText] = useState('');

  const isDrawingPhase = gameStatus === 'drawing';
  const hasAlreadyGuessed = !!guessedWord; // true after a correct guess this turn
  const disabled = isMyTurn && isDrawingPhase;

  function handleSubmit(e) {
    e.preventDefault();
    const val = text.trim();
    if (!val || disabled) return;

    // If in drawing phase AND the player hasn't correctly guessed yet → treat as a guess attempt
    // If already guessed (or not in drawing phase) → send as a plain chat message
    if (isDrawingPhase && !hasAlreadyGuessed) {
      socket.emit('guess', { text: val });
    } else {
      socket.emit('chat_message', { text: val });
    }
    setText('');
  }

  let placeholder = 'Chat...';
  if (isDrawingPhase) {
    placeholder = disabled ? 'You are drawing!' : 'Type your guess...';
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-1.5 sm:gap-2 w-full">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={100}
        className="flex-1 min-w-0 bg-white border-2 border-[#e2e8f0] rounded-xl sm:rounded-2xl px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-[#0f172a] font-bold placeholder-[#94a3b8] focus:outline-none focus:border-[#a3e635] focus:ring-2 sm:focus:ring-4 focus:ring-[#a3e635]/30 transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button 
        type="submit" 
        disabled={disabled || !text.trim()} 
        className="btn-game bg-[#a3e635] disabled:bg-[#f1f5f9] disabled:border-[#cbd5e1] disabled:text-[#94a3b8] disabled:transform-none disabled:active:translate-y-0 text-[#064e3b] rounded-xl sm:rounded-2xl px-2 sm:px-4 py-2 sm:py-3 border-b-[4px] border-[#65a30d] hover:bg-[#bef264] flex items-center justify-center shrink-0 shadow-md"
      > 
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
          <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
        </svg>
      </button>
    </form>
  );
}
