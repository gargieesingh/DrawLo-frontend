'use client';

import socket from '../../socket/socket';
import { useGame } from '../../context/GameContext';

export default function WordPicker() {
  const { state } = useGame();
  const { showWordPicker, wordChoices, timeLeft } = state;

  if (!showWordPicker || !wordChoices?.length) return null;

  function handlePick(word) {
    socket.emit('pick_word', { word });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-sm">
      <div className="bg-white border-2 border-[#e2e8f0] rounded-[20px] sm:rounded-[32px] p-4 sm:p-8 w-full max-w-[280px] sm:max-w-lg mx-4 shadow-[0_16px_40px_rgba(0,0,0,0.1)] text-center flex flex-col items-center animate-bounce-slow relative overflow-hidden">
        
        {/* Background rays or styling */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle at center, #f0fdf4 0%, transparent 60%)' }}></div>

        <h2 className="text-lg sm:text-3xl font-black text-[#0f172a] mb-1 sm:mb-2 relative tracking-wide drop-shadow-[0_2px_0_rgba(163,230,53,1)]" style={{ WebkitTextStroke: '1px #0f172a' }}>
          🎨 Choose a word!
        </h2>
        
        <p className="text-[#475569] mb-3 sm:mb-8 font-bold uppercase tracking-widest text-[9px] sm:text-sm relative">
          Time remaining: <span className="text-[#ef4444] text-xs sm:text-lg ml-1 font-black">{timeLeft}s</span>
        </p>

        <div className="flex flex-col gap-2 sm:gap-4 w-full relative">
          {wordChoices.map((w, idx) => {
            // Give each button a slightly different color tint for playfulness
            const borders = ['border-[#b45309]', 'border-[#047857]', 'border-[#064e3b]'];
            const bgs = ['bg-[#fcd34d]', 'bg-[#86efac]', 'bg-[#a3e635]'];
            const hovers = ['hover:bg-[#fde68a]', 'hover:bg-[#bbf7d0]', 'hover:bg-[#bef264]'];
            const texts = ['text-[#713f12]', 'text-[#064e3b]', 'text-[#064e3b]'];

            return (
              <button
                key={w}
                onClick={() => handlePick(w)}
                className={`btn-game w-full py-2.5 sm:py-5 rounded-lg sm:rounded-2xl text-sm sm:text-2xl tracking-wider font-black uppercase text-center border-b-[4px] sm:border-b-[6px] shadow-lg
                  ${bgs[idx % 3]} ${borders[idx % 3]} ${hovers[idx % 3]} ${texts[idx % 3]}`}
              >
                {w}
              </button>
            )
          })}
        </div>

        {/* Progress bar visualizing time left */}
        <div className="w-full h-1.5 sm:h-3 bg-[#f8fafc] rounded-full mt-4 sm:mt-8 overflow-hidden border-2 border-[#e2e8f0] shadow-inner relative">
           <div 
             className={`h-full bg-[#ef4444] rounded-full transition-all duration-1000 ease-linear shadow-sm ${timeLeft <= 10 ? 'animate-pulse' : ''}`}
             style={{ width: `${Math.max(0, (timeLeft / 30) * 100)}%` }}
           />
        </div>

      </div>
    </div>
  );
}
