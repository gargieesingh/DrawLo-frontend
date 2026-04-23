'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useGame } from '../../../context/GameContext';
import socket from '../../../socket/socket';

const AVATAR_COLORS = ['#e94560','#4ecca3','#f7b731','#a29bfe','#fd79a8','#00cec9','#6c5ce7','#fdcb6e'];

export default function Lobby() {
  const { code } = useParams();
  const { state } = useGame();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showNoUserMsg, setShowNoUserMsg] = useState(false);

  const { players, isHost, roomCode, gameStatus, settings, countdown, isQuickPlay } = state;

  const [localWords, setLocalWords] = useState('');

  useEffect(() => {
    if (settings && settings.customWords) {
      setLocalWords(settings.customWords.join(', '));
    }
  }, [settings?.customWords]);

  function handleWordsChange(e) {
    setLocalWords(e.target.value);
  }

  function handleWordsBlur() {
    if (isHost) {
      const wordsArray = localWords.split(',').map(s => s.trim()).filter(Boolean);
      socket.emit('update_custom_words', { customWords: wordsArray });
    }
  }

  useEffect(() => {
    function onNoUserFound() {
      setShowNoUserMsg(true);
      setTimeout(() => setShowNoUserMsg(false), 5000);
    }
    socket.on('no_user_found', onNoUserFound);
    return () => socket.off('no_user_found', onNoUserFound);
  }, []);

  useEffect(() => {
    if (!state.playerName) {
      router.push('/');
      return;
    }
    window.__drawlo_room_code__ = code;
  }, [state.playerName, router, code]);

  useEffect(() => {
    if (gameStatus === 'picking' || gameStatus === 'drawing') {
      router.push(`/game/${code}`);
    }
  }, [gameStatus, router, code]);

  function handleStart() {
    socket.emit('start_game');
  }

  function handleCopy() {
    navigator.clipboard.writeText(roomCode || code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div 
      className="min-h-screen flex flex-col bg-[#f0fdf4]"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.05) 2px, transparent 2px)',
        backgroundSize: '40px 40px',
        backgroundPosition: '0 0'
      }}
    >
      {/* Top Bar */}
      <div className="bg-white/80 backdrop-blur-md border-b-2 border-[#e2e8f0] px-8 py-5 flex justify-between items-center shadow-sm shrink-0 z-10">
        <h1 className="text-2xl font-black text-[#0f172a] tracking-tight drop-shadow-[0_2px_0_rgba(163,230,53,1)]">DrawLo</h1>
        <div className="bg-[#f1f5f9] text-[#475569] font-black uppercase tracking-widest text-xs px-4 py-2 rounded-full border border-[#cbd5e1]">
          Lobby area
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 flex justify-center items-start">
        <div className="w-full max-w-5xl flex flex-col-reverse md:flex-row gap-8">
          
          {/* Left Column: Room Info & Settings */}
          {!isQuickPlay && (
            <div className="flex-[0.8] flex flex-col gap-8">
              
              {/* Room Code Bubble */}
              <div className="bg-white border-2 border-[#e2e8f0] rounded-[32px] p-4 sm:p-8 shadow-[0_8px_20px_rgba(0,0,0,0.05)] relative">
                <div className="absolute -top-4 -left-3 bg-[#f7b731] text-[#713f12] font-black uppercase text-xs px-3 py-1.5 rounded-full border-2 border-[#713f12] shadow-[0_4px_0_#713f12] rotate-[-5deg] whitespace-nowrap">
                  Room Code
                </div>
                <div className="flex items-center gap-2 sm:gap-4 justify-between mt-2">
                  <span className="text-2xl sm:text-5xl font-black text-[#0f172a] tracking-[0.2em] drop-shadow-[0_2px_0_rgba(163,230,53,1)] truncate">
                    {roomCode || code}
                  </span>
                  <button 
                    onClick={handleCopy}
                    className="btn-game bg-[#f1f5f9] text-[#475569] border-2 border-[#cbd5e1] border-b-4 rounded-xl px-3 sm:px-5 py-2 sm:py-3 hover:bg-[#e2e8f0] text-sm shrink-0"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Settings */}
              <div className="bg-white border-2 border-[#e2e8f0] rounded-[32px] p-5 sm:p-6 shadow-[0_8px_20px_rgba(0,0,0,0.05)] flex-col flex h-full">
                <h3 className="text-[#0f172a] font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="p-1.5 bg-[#f1f5f9] rounded-xl leading-none text-base">⚙️</span> Game Settings
                </h3>
                
                <div className="flex flex-col gap-2 sm:gap-3 flex-1 mb-4">
                  <div className="flex flex-col gap-2 sm:gap-3">
                    <div className="flex justify-between items-center bg-[#f8fafc] px-4 py-2.5 rounded-xl border-2 border-[#e2e8f0]">
                      <span className="text-[#475569] font-bold text-xs sm:text-sm">Rounds</span>
                      <span className="text-[#059669] font-black text-base sm:text-lg">{settings?.rounds || 3}</span>
                    </div>

                    <div className="flex justify-between items-center bg-[#f8fafc] px-4 py-2.5 rounded-xl border-2 border-[#e2e8f0]">
                      <span className="text-[#475569] font-bold text-xs sm:text-sm">Draw Time (s)</span>
                      <span className="text-[#059669] font-black text-base sm:text-lg">{settings?.drawTime || 80}</span>
                    </div>

                    <div className="flex justify-between items-center bg-[#f8fafc] px-4 py-2.5 rounded-xl border-2 border-[#e2e8f0]">
                      <span className="text-[#475569] font-bold text-xs sm:text-sm">Max Players</span>
                      <span className="text-[#059669] font-black text-base sm:text-lg">{settings?.maxPlayers || 8}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2">
                    <span className="text-[#475569] font-bold text-xs tracking-wide">Custom Words (comma separated)</span>
                    <textarea
                      value={localWords}
                      onChange={handleWordsChange}
                      onBlur={handleWordsBlur}
                      readOnly={!isHost}
                      placeholder={isHost ? "Apple, Banana, Car..." : "No custom words set."}
                      className={`w-full bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl p-3 text-sm text-[#0f172a] focus:outline-none focus:border-[#a3e635] resize-none h-20 ${!isHost ? 'opacity-70' : 'shadow-inner'}`}
                    />
                    {isHost && <span className="text-[#94a3b8] text-[9px] font-bold">Options will be exclusively chosen from here if provided.</span>}
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  {/* ── Host Start button (manual override always available) ──── */}
                  {isHost ? (
                    <div className="pt-2 flex flex-col gap-3">
                      <button
                        onClick={handleStart}
                        className="btn-game w-full bg-[#a3e635] text-[#064e3b] disabled:bg-[#f1f5f9] disabled:text-[#94a3b8] disabled:border-[#cbd5e1] disabled:transform-none disabled:active:translate-y-0 rounded-2xl px-8 py-5 text-xl tracking-wide border-2 border-[#064e3b] border-b-[6px] hover:bg-[#bef264]"
                      >
                        Start Game
                      </button>
                      {showNoUserMsg && (
                        <div className="bg-[#ef4444] text-white text-xs font-bold text-center p-2 rounded-xl border-2 border-[#b91c1c] shadow-[0_3px_0_#b91c1c] mx-auto w-max px-4">
                          no user online
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full bg-[#f1f5f9] rounded-2xl py-5 text-center text-[#94a3b8] font-bold border-2 border-[#e2e8f0] animate-pulse">
                      Waiting for host to start...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Right Column: Players Grid */}
          <div className={`bg-white border-2 border-[#e2e8f0] rounded-[32px] p-8 shadow-[0_8px_20px_rgba(0,0,0,0.05)] flex flex-col h-[650px] ${isQuickPlay ? 'w-full max-w-2xl mx-auto' : 'flex-[1.2]'}`}>
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-[#0f172a] font-black text-xl tracking-wide">Players Inside</h3>
               <div className="bg-[#a3e635] text-[#064e3b] font-black px-4 py-1.5 rounded-full border-2 border-[#064e3b] shadow-[0_2px_0_#064e3b]">
                  {players.length} / {settings?.maxPlayers || 8}
               </div>
            </div>

            {players.length === 1 && countdown === null && (
              <div className="bg-[#f0fdf4] text-[#15803d] text-xs font-bold text-center p-3 rounded-xl mb-4 w-full px-4 animate-pulse border border-[#bbf7d0]">
                ⏳ Waiting for 1 more player to auto-start…
              </div>
            )}

            {/* ── Auto-start countdown (shown to ALL players) ───────────── */}
            {countdown !== null && (
              <div className="flex flex-col items-center gap-2 py-3 bg-[#f0fdf4] rounded-2xl border-[3px] border-[#22c55e] shadow-[0_4px_0_#22c55e] mb-4">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                    <circle
                      cx="32" cy="32" r="28" fill="none"
                      stroke="#22c55e" strokeWidth="5"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - countdown / 10)}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.9s linear' }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-[#0f172a]">
                    {countdown}
                  </span>
                </div>
                <span className="text-[#15803d] font-black text-sm uppercase tracking-widest">Game starting soon!</span>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {players.map((player, idx) => {
                  const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  // Use robust logic just in case connection is new
                  const playerIsHost = (state.players[0]?.id === player.id);
                  
                  return (
                    <div key={player.id} className="bg-[#f8fafc] rounded-[24px] p-4 pb-5 border-2 border-[#e2e8f0] flex flex-col items-center gap-3 hover:-translate-y-1 hover:border-[#a3e635] hover:shadow-[0_8px_0_rgba(163,230,53,0.5)] transition-all duration-200 cursor-default shadow-sm">
                      <div 
                        className="relative w-16 h-16 rounded-full flex items-center justify-center text-white text-5xl font-black shadow-[inset_0_-4px_rgba(0,0,0,0.2)] border-2 border-white"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {player.avatar ? (
                          player.avatar.startsWith('/') ? (
                            <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center">
                               <img src={player.avatar} alt="avatar" className="w-full h-full object-cover scale-[1.3] pointer-events-none" />
                            </div>
                          ) : (
                            player.avatar
                          )
                        ) : (
                          player.name.charAt(0).toUpperCase()
                        )}

                      </div>
                      <div className="flex flex-col items-center max-w-full">
                         <span className="text-[#0f172a] font-bold text-base truncate max-w-[120px]" title={player.name}>
                           {player.name}
                         </span>
                         <span className="bg-[#e2e8f0] text-[#475569] text-[10px] font-black uppercase px-2 py-0.5 rounded-full mt-1 border border-[#cbd5e1]">
                           0 pts
                         </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
