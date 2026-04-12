'use client';

const AVATAR_COLORS = ['#e94560','#4ecca3','#f7b731','#a29bfe','#fd79a8','#00cec9','#6c5ce7','#fdcb6e'];

export default function PlayerCard({ player, index, rank, isDrawing, isHost }) {
  const { name, score, id, hasGuessed } = player;

  const idx = typeof index === 'number' ? index : [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];

  return (
    <div
      className={`relative flex items-center gap-1 sm:gap-3 px-1.5 sm:px-4 py-1.5 sm:py-3 rounded-xl sm:rounded-2xl border-[1.5px] sm:border-2 transition-all duration-300 transform
        ${hasGuessed 
          ? 'bg-[#f0fdf4] border-[#22c55e] shadow-[0_1.5px_0_#22c55e] sm:shadow-[0_2px_0_#22c55e] scale-100' 
          : 'bg-[#f8fafc] border-[#e2e8f0] shadow-sm hover:-translate-y-1 hover:border-[#a3e635] hover:shadow-[0_8px_0_rgba(163,230,53,0.5)]'}`}
    >
      {/* Rank/Avatar */}
      <div className="relative shrink-0 flex items-center gap-1 sm:gap-3">
        {rank && (
          <span className="text-[#475569] text-[8px] sm:text-sm font-black w-3 sm:w-4 text-center">{rank}</span>
        )}
        
        <div 
          className="relative w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-black text-xs sm:text-2xl shadow-[inset_0_-1.5px_rgba(0,0,0,0.2)] sm:shadow-[inset_0_-2px_rgba(0,0,0,0.2)] overflow-hidden"
          style={{ backgroundColor: avatarColor }}
        >
          {player.avatar ? (
            player.avatar.startsWith('/') ? (
              <img src={player.avatar} alt="avatar" className="w-full h-full object-cover scale-[1.3] pointer-events-none" />
            ) : (
              player.avatar
            )
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </div>
        
        {/* Status icons overlay */}
        {isHost && (
          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-[#f7b731] rounded-full p-0.5 sm:p-1 border-[1.5px] sm:border-2 border-white text-[7px] sm:text-xs leading-none shadow-[0_1.5px_0_#713f12] sm:shadow-[0_2px_0_#713f12]" title="Host">
            👑
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex items-center justify-between">
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-[#0f172a] text-[10px] sm:text-base truncate" title={name}>
            {name}
          </span>
          {isDrawing && (
             <span className="text-[7px] sm:text-[10px] font-black text-[#e94560] uppercase tracking-widest mt-0.5 animate-pulse border border-[#e94560]/30 bg-[#e94560]/10 px-1 sm:px-2 py-0.5 rounded-full w-max">
               🎨
             </span>
          )}
          {hasGuessed && !isDrawing && (
             <span className="text-[7px] sm:text-[10px] font-black text-[#4ecca3] uppercase tracking-widest mt-0.5 flex items-center gap-0.5 border border-[#4ecca3]/30 bg-[#4ecca3]/10 px-1 sm:px-2 py-0.5 rounded-full w-max">
               ✓
             </span>
          )}
        </div>
        
        <div className={`text-[10px] sm:text-base font-black text-right shrink-0 ml-1 ${rank === 1 ? 'text-[#f7b731]' : 'text-[#15803d]'}`}>
          {score}
        </div>
      </div>
    </div>
  );
}
