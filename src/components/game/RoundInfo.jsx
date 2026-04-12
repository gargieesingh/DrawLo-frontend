'use client';

import { useGame } from '../../context/GameContext';

export default function RoundInfo() {
  const { state } = useGame();
  const { round, totalRounds, currentDrawer, gameStatus } = state;

  if (!round) return null;

  const drawerName = typeof currentDrawer === 'object' ? currentDrawer?.name : null;

  return (
    <div className="flex items-center gap-4 h-full">
      <div className="bg-white border-2 border-[#e2e8f0] text-[#0f172a] px-2 sm:px-4 py-1 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-base font-black tracking-wider whitespace-nowrap shadow-[0_2px_0_#94a3b8]">
        Round {round}<span className="text-[#94a3b8] mx-0.5 sm:mx-1">/</span>{totalRounds}
      </div>
      
      {drawerName && gameStatus !== 'waiting' && (
        <div className="hidden lg:flex items-center bg-[#f1f5f9] rounded-full border-2 border-[#cbd5e1] pl-2 pr-4 py-1.5 shadow-[0_2px_0_#94a3b8] whitespace-nowrap">
          <span className="bg-white rounded-full p-1.5 mr-2 shadow-sm text-sm leading-none">🎨</span>
          <span className="text-[#0f172a] text-sm font-black mr-1">{drawerName}</span>
          <span className="text-[#475569] text-sm font-bold">is drawing</span>
        </div>
      )}
    </div>
  );
}
