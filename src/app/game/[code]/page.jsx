'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useGame } from '../../../context/GameContext';
import socket from '../../../socket/socket';
import Canvas from '../../../components/canvas/Canvas';
import Timer from '../../../components/game/Timer';
import WordHint from '../../../components/game/WordHint';
import WordPicker from '../../../components/game/WordPicker';
import RoundInfo from '../../../components/game/RoundInfo';
import PlayerList from '../../../components/players/PlayerList';
import Chat from '../../../components/chat/Chat';
import ChatInput from '../../../components/chat/ChatInput';

const AVATAR_COLORS = ['#e94560','#4ecca3','#f7b731','#a29bfe','#fd79a8','#00cec9','#6c5ce7','#fdcb6e'];

export default function Game() {
  const { code } = useParams();
  const { state, dispatch } = useGame();
  const router = useRouter();

  const { gameStatus, gameResult, players } = state;
  const [waitingForOthers, setWaitingForOthers] = useState(false);

  useEffect(() => {
    if (!state.playerName) {
      router.push('/');
      return;
    }
  }, [state.playerName, router]);

  useEffect(() => {
    if (gameStatus !== 'gameEnd') {
      setWaitingForOthers(false);
    }
  }, [gameStatus]);

  function handlePlayAgain() {
    setWaitingForOthers(true);
    socket.emit('play_again_intent');
  }

  function handleExit() {
    window.__drawlo_room_code__ = null; // prevent turn_start from navigating back
    socket.emit('leave_room');
    router.push('/');
  }

  return (
    <div 
      className="h-screen flex flex-col bg-[#f0fdf4] overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.05) 2px, transparent 2px)',
        backgroundSize: '30px 30px'
      }}
    >
      
      <WordPicker />

      {/* Game End Overlay */}
      {gameStatus === 'gameEnd' && gameResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-md">
          <div className="flex flex-col items-center w-full animate-bounce-slow">
            <h1 className="text-5xl font-black text-white mb-2 drop-shadow-[0_4px_0_rgba(163,230,53,1)]" style={{ WebkitTextStroke: '1px #0f172a' }}>
              Game Over!
            </h1>
            
            <div className="bg-white border-2 border-[#e2e8f0] rounded-[32px] p-8 w-full max-w-sm shadow-[0_16px_40px_rgba(0,0,0,0.1)] my-8 relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#f7b731] text-[#713f12] font-black uppercase tracking-widest px-6 py-2 rounded-full border-4 border-[#f7b731] shadow-[0_4px_0_#713f12] whitespace-nowrap">
                👑 Winner: {gameResult.players[0]?.name}
              </div>
              
              <div className="flex flex-col gap-3 mt-4">
                {gameResult.players.map((p, i) => {
                  const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  return (
                    <div key={p.id} className={`flex items-center gap-4 px-4 py-3 border-2 rounded-2xl ${i === 0 ? 'bg-[#f0fdf4] border-[#22c55e] shadow-[0_4px_0_#22c55e]' : 'bg-[#f8fafc] border-[#e2e8f0] shadow-sm'}`}>
                      <span className={`font-black w-6 text-center ${i===0?'text-[#15803d]':'text-[#64748b]'}`}>#{i + 1}</span>
                      <div 
                        className="relative w-10 h-10 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-[inset_0_-2px_rgba(0,0,0,0.3)] shrink-0 overflow-hidden"
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
                      <span className="font-bold text-[#0f172a] flex-1 truncate text-lg">{p.name}</span>
                      <span className={`font-black ${i===0?'text-[#15803d]':'text-[#0f172a]'}`}>{p.score}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {!waitingForOthers ? (
              <div className="flex gap-4">
                <button 
                  onClick={handleExit} 
                  className="btn-game bg-[#f1f5f9] text-[#475569] rounded-2xl px-8 py-4 border-2 border-[#cbd5e1] border-b-[6px] hover:bg-[#e2e8f0] text-xl min-w-[160px]"
                >
                  Exit
                </button>
                <div className="flex flex-col items-center gap-2">
                  <button 
                    onClick={handlePlayAgain}
                    className="btn-game bg-[#a3e635] text-[#064e3b] rounded-2xl px-8 py-4 border-2 border-[#064e3b] border-b-[6px] hover:bg-[#bef264] text-xl min-w-[160px] shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 w-full gap-4">
                <div className="w-12 h-12 border-4 border-[#e2e8f0] border-t-[#a3e635] rounded-full animate-spin"></div>
                <span className="text-white font-bold animate-pulse text-xl">Waiting for others...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-white/95 backdrop-blur-md border-b-2 border-[#e2e8f0] h-16 px-3 sm:px-6 flex items-center shrink-0 shadow-sm z-10 w-full justify-between overflow-hidden relative">
        
        {/* Left: Logo & Round */}
        <div className="flex items-center gap-2 sm:gap-6 w-[25%] shrink-0">
          <h1 className="hidden sm:block text-2xl font-black tracking-tight text-[#0f172a] drop-shadow-[0_2px_0_rgba(163,230,53,1)] cursor-default">🎨 DrawLo</h1>
          <RoundInfo />
        </div>

        {/* Center: Hint Area */}
        <div className="flex-1 flex justify-center items-center h-full px-2 sm:px-4 overflow-hidden">
          <WordHint />
        </div>

        {/* Right: Timer */}
        <div className="w-[25%] flex justify-end shrink-0 pl-2 sm:pl-6">
          <Timer />
        </div>

      </header>

      {/* Main Layout */}
      {/* Large screens: 3-column row | Small/medium: canvas top, sidebars bottom */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto p-2 lg:p-4 grid grid-cols-2 lg:grid-cols-[280px_minmax(0,1fr)_320px] grid-rows-[3fr_2fr] lg:grid-rows-1 gap-1.5 sm:gap-2 lg:gap-4 min-h-0">

        {/* Canvas - Top on mobile, Center on desktop */}
        <main className="col-span-2 row-start-1 row-end-2 lg:col-span-1 lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2 flex flex-col items-center justify-center min-h-0 overflow-hidden min-w-0 lg:p-2">
           <Canvas />
        </main>

        {/* Leaderboard - Bottom left on mobile, Left on desktop */}
        <aside className="col-start-1 col-end-2 row-start-2 row-end-3 lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2 flex flex-col bg-white border-2 border-[#e2e8f0] overflow-hidden min-w-0 relative rounded-[20px] sm:rounded-[24px] lg:rounded-[32px] shadow-sm lg:shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
           <div className="bg-[#f8fafc] text-[#475569] border-b-2 border-[#e2e8f0] shrink-0 z-10 py-1.5 sm:py-2 lg:py-3 px-2 sm:px-3 lg:px-5">
              <h3 className="font-black uppercase tracking-widest flex items-center gap-1 lg:gap-2 text-[9px] sm:text-[10px] lg:text-sm">
                 🏆 <span className="lg:hidden">Board</span><span className="hidden lg:inline">Leaderboard</span>
              </h3>
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar p-0.5 sm:p-1 lg:p-3">
             <PlayerList />
           </div>
        </aside>

        {/* Chat - Bottom right on mobile, Right on desktop */}
        <aside className="col-start-2 col-end-3 row-start-2 row-end-3 lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-2 flex flex-col bg-white border-2 border-[#e2e8f0] overflow-hidden min-w-0 relative rounded-[20px] sm:rounded-[24px] lg:rounded-[32px] shadow-sm lg:shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
           <div className="bg-[#f8fafc] text-[#475569] border-b-2 border-[#e2e8f0] shrink-0 z-10 py-1.5 sm:py-2 lg:py-3 px-2 sm:px-3 lg:px-5">
              <h3 className="font-black uppercase tracking-widest flex items-center gap-1 lg:gap-2 text-[9px] sm:text-[10px] lg:text-sm">
                 💬 <span className="lg:hidden">Chat</span><span className="hidden lg:inline">Chat Area</span>
              </h3>
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#f0fdf4]/50 p-0.5 sm:p-1 lg:p-3">
             <Chat />
           </div>
           <div className="bg-[#f8fafc] border-t-2 border-[#e2e8f0] shrink-0 p-1.5 sm:p-2 lg:p-3">
             <ChatInput />
           </div>
        </aside>

      </div>
    </div>
  );
}
