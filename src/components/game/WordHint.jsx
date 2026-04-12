'use client';

import { useGame } from '../../context/GameContext';

export default function WordHint() {
  const { state } = useGame();
  const { wordHint, wordLength, gameStatus, isMyTurn, myWord } = state;

  if (gameStatus === 'waiting') {
    return (
      <div className="bg-[#f1f5f9] text-[#475569] px-6 py-2 rounded-full border-2 border-[#cbd5e1] shadow-[0_2px_0_#94a3b8] text-xs font-black uppercase tracking-[0.2em] transform -rotate-1">
        Waiting to start
      </div>
    );
  }

  if (gameStatus === 'picking') {
    return (
      <div className="bg-white text-[#0f172a] px-3 sm:px-6 py-1 sm:py-2 rounded-full border-2 border-[#e2e8f0] shadow-sm text-[10px] sm:text-sm font-black tracking-wide whitespace-nowrap">
        {isMyTurn ? <span className="text-[#d97706]">🎯 <span className="hidden sm:inline">Group</span> selecting...</span> : '⏳ Drawer is picking...'}
      </div>
    );
  }

  if (isMyTurn && myWord) {
    return (
      <div className="flex flex-col items-center justify-center w-full animate-bounce-slow">
        <span className="text-[#d97706] text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-1 bg-[#fef3c7] px-2 sm:px-3 py-0.5 rounded-full border border-[#fcd34d]">
          Your word to draw
        </span>
        <span className="text-[#0f172a] text-lg sm:text-3xl font-black tracking-[0.2em] drop-shadow-[0_2px_0_rgba(163,230,53,1)] uppercase">
          {myWord}
        </span>
      </div>
    );
  }

  if (gameStatus === 'turnEnd' && state.turnResult) {
    return (
      <div className="flex flex-col items-center justify-center w-full animate-bounce-slow">
        <span className="text-[#4338ca] text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-1 bg-[#e0e7ff] px-2 sm:px-3 py-0.5 rounded-full border border-[#c7d2fe]">
          The word was
        </span>
        <span className="text-[#0f172a] text-lg sm:text-3xl font-black tracking-[0.2em] drop-shadow-[0_2px_0_rgba(163,230,53,1)] uppercase">
          {state.turnResult.word}
        </span>
      </div>
    );
  }

  if (state.guessedWord) {
    return (
      <div className="flex flex-col items-center justify-center w-full animate-bounce-slow">
        <span className="text-[#15803d] text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-1 bg-[#f0fdf4] px-2 sm:px-3 py-0.5 rounded-full border border-[#bbf7d0]">
          🎉 You guessed it!
        </span>
        <span className="text-[#15803d] text-lg sm:text-3xl font-black tracking-[0.2em] drop-shadow-[0_2px_0_#bbf7d0] uppercase">
          {state.guessedWord}
        </span>
      </div>
    );
  }

  if (!wordHint) return null;

  return (
    <div className="flex flex-col items-center w-full">
      <span className="text-[#15803d] text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-0.5 sm:mb-1 bg-[#f0fdf4] px-2 sm:px-3 py-0.5 rounded-full border border-[#bbf7d0]">
        {wordLength} letters
      </span>
      <span className="text-[#0f172a] text-base sm:text-3xl font-black tracking-[0.2em] sm:tracking-[0.4em] drop-shadow-[0_2px_0_rgba(163,230,53,1)]">
        {wordHint}
      </span>
    </div>
  );
}
