'use client';

import { useGame } from '../../context/GameContext';

const AVATAR_COLORS = ['#e94560','#4ecca3','#f7b731','#a29bfe','#fd79a8','#00cec9','#6c5ce7','#fdcb6e'];

export default function TurnResult() {
  const { state } = useGame();
  const { turnResult } = state;

  if (!turnResult) return null;

  // Sort players by score for the end-of-turn display
  const sortedPlayers = [...turnResult.players].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-[#1e1b4b] border-[4px] border-[#4c1d95] rounded-[32px] p-8 w-full max-w-md shadow-[0_16px_0_#2e1065] flex flex-col items-center animate-bounce-slow relative overflow-hidden">
        
        <h2 className="text-[#a78bfa] text-sm font-black uppercase tracking-widest drop-shadow-md mb-2">
          The word was:
        </h2>
        
        <div className={`text-2xl sm:text-5xl font-black text-white px-8 py-3 bg-[#0f172a] border-[4px] border-[#334155] rounded-[24px] uppercase ${turnResult.word === '(Skipped)' ? 'tracking-normal text-sm sm:text-xl' : 'tracking-[0.2em]'} shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)] mb-8 transform -rotate-1`}>
          {turnResult.word === '(Skipped)' ? 'No word chosen' : turnResult.word}
        </div>

        <div className="w-full flex justify-between tracking-widest text-[#64748b] text-xs font-black uppercase mb-3 px-2">
           <span>Player</span>
           <span>Score</span>
        </div>

        <div className="flex flex-col gap-3 w-full">
          {sortedPlayers.map((p, idx) => {
            const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            return (
              <div 
                key={p.id} 
                className={`flex items-center justify-between px-4 py-3 rounded-[20px] border-[3px] 
                  ${idx === 0 ? 'bg-[#1e293b] border-[#e94560] shadow-[0_4px_0_#e94560]' : 'bg-[#1e293b] border-[#334155] shadow-[0_4px_0_#0f172a]'}`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="relative w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm shadow-[inset_0_-2px_rgba(0,0,0,0.3)] overflow-hidden"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {p.avatar ? (
                      p.avatar.startsWith('/') ? (
                        <img src={p.avatar} alt="avatar" className="w-full h-full object-cover scale-[1.3] pointer-events-none" />
                      ) : (
                        p.avatar
                      )
                    ) : (
                      p.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="font-bold text-lg text-white truncate max-w-[150px]">{p.name}</span>
                </div>
                <div className={`font-black text-xl ${idx === 0 ? 'text-[#e94560]' : 'text-[#4ecca3]'}`}>
                  {p.score}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
