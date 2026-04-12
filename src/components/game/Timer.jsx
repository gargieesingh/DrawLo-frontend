'use client';

import { useGame } from '../../context/GameContext';

export default function Timer() {
  const { state } = useGame();
  const { timeLeft, gameStatus, settings } = state;

  const totalTime = settings?.drawTime || 80;
  const pct = gameStatus === 'drawing' ? Math.max(0, (timeLeft / totalTime) * 100) : 0;

  let barColor = 'bg-[#a3e635] border-b-[4px] border-[#65a30d] shadow-[0_0_15px_rgba(163,230,53,0.5)]'; 
  if (pct <= 50 && pct > 25) barColor = 'bg-[#f7b731] border-b-[4px] border-[#b45309] shadow-[0_0_15px_rgba(247,183,49,0.5)]'; 
  if (pct <= 25) barColor = 'bg-[#ef4444] border-b-[4px] border-[#b91c1c] shadow-[0_0_20px_rgba(239,68,68,0.8)]'; 

  const pulseClass = pct <= 25 && gameStatus === 'drawing' ? 'animate-[pulse_0.5s_ease-in-out_infinite]' : '';

  return (
    <div className="flex items-center gap-1.5 sm:gap-4 w-full h-full justify-end">
      <span className={`text-base sm:text-2xl font-black w-8 sm:w-12 text-right shrink-0 drop-shadow-md
        ${pct <= 25 && gameStatus === 'drawing' ? 'text-[#ef4444] animate-bounce' : 'text-[#0f172a]'}`}>
        {gameStatus === 'drawing' ? `${timeLeft}s` : '-'}
      </span>
      <div className="hidden sm:block flex-1 h-3 sm:h-6 bg-[#f8fafc] rounded-full overflow-hidden border-2 border-[#e2e8f0] shadow-inner relative">
        <div
          className={`absolute left-0 top-0 bottom-0 rounded-full transition-all duration-1000 ease-linear ${barColor} ${pulseClass}`}
          style={{ width: `${pct}%` }}
        >
          {/* Shine effect on bar */}
          <div className="absolute top-1 left-2 right-2 h-1.5 bg-white/30 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
