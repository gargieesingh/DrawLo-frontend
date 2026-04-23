'use client';

import { useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';

const AVATAR_COLORS = ['#e94560','#4ecca3','#f7b731','#a29bfe','#fd79a8','#00cec9','#6c5ce7','#fdcb6e'];

export default function Chat() {
  const { state } = useGame();
  const { messages, playerId } = state;
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function renderMessage(msg, index) {
    const key = msg._id || `${msg.id}-${msg.text}-${index}`;

    // ── System notification (centered pill) ──────────────────────────────────
    if (msg.type === 'system') {
      return (
        <div key={key} className="flex justify-center items-center my-[1px] sm:my-0.5 w-full">
          <div className="bg-[#fbbf24] text-[#78350f] font-black text-[6px] sm:text-[7px] uppercase tracking-widest px-1 sm:px-1.5 py-0.5 rounded-full shadow-[0_1.5px_0_#b45309] sm:shadow-[0_2px_0_#b45309] text-center max-w-full break-words leading-tight">
            {msg.text}
          </div>
        </div>
      );
    }

    // ── Correct-guess celebration (centered pill) ─────────────────────────────
    if (msg.type === 'correct') {
      return (
        <div key={key} className="flex justify-center my-1.5 sm:my-2 w-full animate-bounce-slow">
          <div className="bg-[#f0fdf4] border-[1.5px] sm:border-[2px] border-[#22c55e] text-[#15803d] font-black text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl rounded-tr-sm shadow-[0_2px_0_#22c55e] sm:shadow-[0_3px_0_#22c55e] flex items-center gap-1 sm:gap-2">
            <span className="text-sm sm:text-lg leading-none">✅</span>
            <span>{msg.name} guessed it!</span>
          </div>
        </div>
      );
    }

    // ── Shared color + avatar logic ───────────────────────────────────────────
    let charCode = 0;
    if (msg.id) charCode = [...msg.id].reduce((a, c) => a + c.charCodeAt(0), 0);
    else if (msg.name) charCode = [...msg.name].reduce((a, c) => a + c.charCodeAt(0), 0);
    const colorTheme = AVATAR_COLORS[charCode % AVATAR_COLORS.length];

    const sender = state.players.find(p => p.id === msg.id);
    const avatar = sender?.avatar || msg.avatar || null;

    const isOwn = msg.id && msg.id === playerId;

    function AvatarBubble({ faded }) {
      return (
        <div
          className={`relative w-5 h-5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-[9px] sm:text-xs font-black shadow-[inset_0_-2px_rgba(0,0,0,0.2)] shrink-0 overflow-hidden${faded ? ' opacity-50 border-2 border-transparent' : ''}`}
          style={{ backgroundColor: colorTheme }}
        >
          {avatar ? (
            avatar.startsWith('/') ? <img src={avatar} alt="avatar" className="w-full h-full object-cover scale-[1.3] pointer-events-none" /> : avatar
          ) : (
            msg.name.charAt(0).toUpperCase()
          )}
        </div>
      );
    }

    // ── Guess bubble ──────────────────────────────────────────────────────────
    if (msg.type === 'guess') {
      if (isOwn) {
        return (
          <div key={key} className="flex flex-row-reverse gap-1.5 sm:gap-2 my-1 sm:my-2 items-end">
            <AvatarBubble faded={false} />
            <div className="bg-[#a3e635] border-2 border-[#65a30d] text-[#064e3b] px-2 sm:px-3 py-1 sm:py-2 rounded-[12px] sm:rounded-[16px] rounded-br-sm max-w-[85%] break-words shadow-sm flex flex-col gap-0.5 items-end">
              <span style={{ color: '#065f46' }} className="font-black text-[10px] sm:text-xs leading-tight">You</span>
              <span className="opacity-90 font-semibold text-xs sm:text-sm">{msg.text}</span>
            </div>
          </div>
        );
      }
      return (
        <div key={key} className="flex gap-1.5 sm:gap-2 my-1 sm:my-2 items-end">
          <AvatarBubble faded={false} />
          <div className="bg-white border-2 border-[#e2e8f0] text-[#0f172a] px-2 sm:px-3 py-1 sm:py-2 rounded-[12px] sm:rounded-[16px] rounded-bl-sm max-w-[85%] break-words shadow-sm flex flex-col gap-0.5">
            <span style={{ color: colorTheme }} className="font-black text-[10px] sm:text-xs leading-tight">{msg.name}</span>
            <span className="opacity-90 font-semibold text-xs sm:text-sm">{msg.text}</span>
          </div>
        </div>
      );
    }

    // ── Chat bubble (type === 'chat') ─────────────────────────────────────────
    if (isOwn) {
      return (
        <div key={key} className="flex flex-row-reverse gap-1.5 sm:gap-2 my-1 sm:my-2 items-end">
          <AvatarBubble faded={true} />
          <div className="bg-[#e0f2fe] border-2 border-[#bae6fd] text-[#0c4a6e] px-2 sm:px-3 py-1 sm:py-2 rounded-[12px] sm:rounded-[16px] rounded-br-sm max-w-[85%] break-words shadow-sm flex flex-col gap-0.5 items-end">
            <span style={{ color: '#0369a1' }} className="font-black opacity-100 text-[10px] sm:text-xs leading-tight">You</span>
            <span className="font-semibold text-xs sm:text-sm">{msg.text}</span>
          </div>
        </div>
      );
    }
    return (
      <div key={key} className="flex gap-1.5 sm:gap-2 my-1 sm:my-2 items-end">
        <AvatarBubble faded={true} />
        <div className="bg-[#f8fafc] border-2 border-[#f1f5f9] text-[#475569] px-2 sm:px-3 py-1 sm:py-2 rounded-[12px] sm:rounded-[16px] rounded-bl-sm max-w-[85%] break-words shadow-sm flex flex-col gap-0.5">
          <span style={{ color: colorTheme }} className="font-black opacity-100 text-[10px] sm:text-xs leading-tight">{msg.name}</span>
          <span className="font-semibold text-xs sm:text-sm">{msg.text}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-2">
      {messages.length === 0 && (
        <div className="text-center text-[#94a3b8] text-xs mt-12 font-black uppercase tracking-[0.2em] flex items-center justify-center flex-col gap-3">
          <div className="text-4xl opacity-50 border-[#94a3b8]">💬</div>
          <span>Chat feeds here</span>
        </div>
      )}
      {messages.map((msg, i) => renderMessage(msg, i))}
      <div ref={bottomRef} />
    </div>
  );
}
