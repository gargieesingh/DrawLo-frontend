'use client';

const AVATAR_COLORS = ['#e94560','#4ecca3','#f7b731','#a29bfe','#fd79a8','#00cec9','#6c5ce7','#fdcb6e'];

export default function PlayerCard({ player, index, rank, isDrawing, isHost }) {
  const { name, score, id, hasGuessed } = player;

  const idx = typeof index === 'number' ? index : [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];

  return (
    <div
      className={`relative flex items-center gap-1 sm:gap-3 px-1.5 sm:px-4 py-1.5 rounded-xs border-b-1 border-gray-300 transition-all duration-300 transform
        ${hasGuessed
          ? 'bg-[#22c55e] scale-100'
          : isDrawing
          ? 'bg-[#f7b731] border-[#e2a800]'
          : 'bg-[#edeef0] border-[#e2e8f0]'}`}
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

      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex items-center justify-between">
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-[#0f172a] text-[10px] sm:text-base truncate flex items-center gap-1" title={name}>
            {name}
            {isDrawing && (
              <svg viewBox="0 0 100 100" className="w-[12px] h-[12px] sm:w-[18px] sm:h-[18px] drop-shadow-sm shrink-0" aria-label="Drawing">
                <g transform="translate(50, 50) rotate(45) translate(-50, -50)">
                  <polygon points="30,70 70,70 50,100" fill="#fde68a" stroke="#1e293b" strokeWidth="5" strokeLinejoin="round" />
                  <polygon points="43,89.5 57,89.5 50,100" fill="#1e293b" stroke="#1e293b" strokeWidth="2" strokeLinejoin="round" />
                  <rect x="30" y="30" width="40" height="40" fill="#fca5a5" stroke="#1e293b" strokeWidth="5" strokeLinejoin="round" />
                  <rect x="43" y="30" width="14" height="40" fill="#ef4444" />
                  <rect x="28" y="20" width="44" height="10" rx="3" fill="#f8fafc" stroke="#1e293b" strokeWidth="5" strokeLinejoin="round" />
                  <path d="M 30 20 L 30 10 C 30 4 35 2 50 2 C 65 2 70 4 70 10 L 70 20 Z" fill="#f43f5e" stroke="#1e293b" strokeWidth="5" strokeLinejoin="round" />
                </g>
              </svg>
            )}
          </span>
        </div>
        <div className={`text-[10px] sm:text-base font-black text-right shrink-0 ml-1 ${rank === 1 ? 'text-[#1a1a19]' : 'text-[#161716]'}`}>
          {score}
        </div>
      </div>
    </div>
  );
}
