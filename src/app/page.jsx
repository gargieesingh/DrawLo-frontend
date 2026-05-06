'use client';

import { useState, useEffect } from 'react';
import socket from '../socket/socket';
import { useGame } from '../context/GameContext';
import HowToPlay from '../components/HowToPlay';

const AVATARS = [
  ...Array.from({ length: 17 }, (_, i) => `/avatars/avatar_${i}.svg`),   // 0–16 → SVG
  ...Array.from({ length: 12 }, (_, i) => `/avatars/avatar_${i + 17}.png`), // 17–28 → PNG
];

export default function Home() {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [code, setCode] = useState(''); // null | 'private'
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const { state, dispatch } = useGame();

  // Reset state and disconnect socket when landing on home
  useEffect(() => {
    dispatch({ type: 'RESET' });
    if (socket.connected) {
      socket.disconnect();
    }
  }, [dispatch]);

  function connectAndEmit(event, payload) {
    setIsConnecting(true);
    if (socket.connected) {
      dispatch({ type: 'SET_PLAYER', name: name.trim(), avatar: selectedAvatar, id: socket.id });
      socket.emit(event, { ...payload, avatar: selectedAvatar });
    } else {
      socket.once('connect', () => {
        dispatch({ type: 'SET_PLAYER', name: name.trim(), avatar: selectedAvatar, id: socket.id });
        socket.emit(event, { ...payload, avatar: selectedAvatar });
      });
      socket.connect();
    }
  }

  function handleQuickPlay(e) {
    e.preventDefault();
    if (!name.trim()) {
      dispatch({ type: 'SET_ERROR', message: 'Enter your name first' });
      return;
    }
    dispatch({ type: 'SET_QUICK_PLAY', value: true });
    connectAndEmit('quick_play', { name: name.trim() });
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) {
      dispatch({ type: 'SET_ERROR', message: 'Name is required' });
      return;
    }
    dispatch({ type: 'SET_QUICK_PLAY', value: false });
    connectAndEmit('create_room', { name: name.trim(), settings: { maxPlayers: 8, rounds: 3, drawTime: 80, isPrivate: true } });
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!name.trim()) {
      dispatch({ type: 'SET_ERROR', message: 'Name is required' });
      return;
    }
    if (!code.trim()) {
      dispatch({ type: 'SET_ERROR', message: 'Room code is required' });
      return;
    }
    dispatch({ type: 'SET_QUICK_PLAY', value: false });
    connectAndEmit('join_room', { name: name.trim(), code: code.trim().toUpperCase() });
  }

  return (
    <>
    <div 
      className="min-h-screen w-full max-w-[100vw] overflow-x-hidden mx-auto flex flex-col items-center justify-start py-8 px-4 bg-[#f0fdf4]" 
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.05) 2px, transparent 2px)',
        backgroundSize: '40px 40px',
        backgroundPosition: '0 0'
      }}
    >
      <div className="relative mb-10 text-center animate-bounce-slow">
         <h1 className="text-7xl font-black tracking-tight text-[#0f172a] drop-shadow-[0_6px_0_rgba(163,230,53,1)] mb-4" style={{ WebkitTextStroke: '1px #0f172a' }}>
          Draw<span className="text-[#a3e635]">Lo</span>
         </h1>
         <div className="inline-block bg-[#a3e635] text-[#064e3b] font-black uppercase tracking-[0.2em] text-sm px-6 py-2 rounded-full border border-[#65a30d] shadow-[0_4px_0_#65a30d] transform -rotate-2">
           Draw. Guess. Win.
         </div>
      </div>

      <div className="bg-white border-2 border-[#e2e8f0] p-8 rounded-md shadow-[0_12px_40px_rgba(0,0,0,0.05)] w-full max-w-md flex flex-col items-center relative z-10">
        
        <form className="w-full flex flex-col">
          {/* Name input — shared by all modes */}
          <label className="block text-[#475569] text-sm font-black uppercase tracking-widest mb-1 ml-2">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aryan"
            maxLength={15}
            className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg px-3 py-2 text-[#0f172a] font-bold text-md placeholder-[#94a3b8] focus:outline-none focus:border-[#a3e635] focus:ring-4 focus:ring-[#a3e635]/30 transition-all duration-200 mb-6 shadow-inner"
          />

          {/* Avatar Selector Dropdown */}
          <label className="block text-[#475569] text-sm font-black uppercase tracking-widest mb-1 ml-2">Choose Avatar</label>
          <div className="relative mb-8">
            <button
              type="button"
              onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
              className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg px-4 py-2 focus:outline-none focus:border-[#a3e635] focus:ring-4 focus:ring-[#a3e635]/30 transition-all duration-200 shadow-inner flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#a3e635] flex items-center justify-center overflow-hidden border-2 border-[#c8e88a] shrink-0">
                  {selectedAvatar.startsWith('/') ? (
                    <img src={selectedAvatar} className="w-full h-full object-cover scale-[1.3] pointer-events-none" alt="Selected avatar" />
                  ) : (
                    <span className="text-2xl">{selectedAvatar}</span>
                  )}
                </div>
                <span className="text-sm font-bold text-[#475569] truncate">Select your avatar</span>
              </div>
              <span className={`transform transition-transform shrink-0 ${isAvatarDropdownOpen ? 'rotate-180' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" className="w-3 h-3 fill-current text-[#94a3b8]">
                  <path d="M140.3 376.8c12.6 10.2 31.1 9.5 42.8-2.2l128-128c9.2-9.2 11.9-22.9 6.9-34.9S301.4 192 288.5 192l-256 0c-12.9 0-24.6 7.8-29.6 19.8S.7 237.5 9.9 246.6l128 128 2.4 2.2z"/>
                </svg>
              </span>
            </button>

            
            {isAvatarDropdownOpen && (
              <div 
                className="absolute z-50 w-full mt-2 bg-white border-2 border-[#e2e8f0] rounded-lg p-4 shadow-[0_12px_24px_rgba(0,0,0,0.25)]"
              >
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(avatar);
                        setIsAvatarDropdownOpen(false);
                      }}
                      className={`relative w-full aspect-square flex items-center justify-center rounded-full transition-all duration-200 border-2 overflow-hidden
                        ${selectedAvatar === avatar 
                          ? 'bg-[#a3e635] border-[#064e3b] scale-[1.05] shadow-[0_4px_0_#064e3b]' 
                          : 'bg-[#f1f5f9] border-[#cbd5e1] hover:bg-[#e2e8f0] grayscale-[0.3] hover:grayscale-0 hover:scale-[1.02]'}`}
                    >
                      {avatar.startsWith('/') ? (
                        <img src={avatar} className="w-full h-full object-cover scale-[1.3] pointer-events-none" alt="Avatar option" />
                      ) : (
                        <span className="text-3xl">{avatar}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Quick Play (primary CTA) ── */}
          <button
            onClick={handleQuickPlay}
            disabled={isConnecting}
            className={`btn-game w-full rounded-lg py-2 px-8 border-b-[3px] mb-4 mx-auto shadow-[0_4px_15px_rgba(163,230,53,0.3)] transition-all ${
              isConnecting 
                ? 'bg-[#e2e8f0] text-[#94a3b8] border-[#cbd5e1] cursor-not-allowed transform-none' 
                : 'bg-[#a3e635] text-[#064e3b] border-[#65a30d] hover:bg-[#bef264] hover:border-[#4d7c0f]'
            }`}
          >
            <span className="block text-xl font-black">Play</span>
            {/* <span className={`block text-xs font-bold mt-0.5 ${isConnecting ? 'text-[#94a3b8]' : 'text-[#064e3b] opacity-80'}`}>
              {isConnecting ? 'Connecting...' : 'Auto-match with other players'}
            </span> */}
          </button>

          {/* ── Separator ── */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-[#e2e8f0]" />
            <span className="text-[#94a3b8] text-xs font-black uppercase tracking-[0.3em]">or</span>
            <div className="flex-1 h-px bg-[#e2e8f0]" />
          </div>

          {/* ── Private Room ── */}
          <div className="w-full flex flex-col gap-4">
             <button
                type="button"
                onClick={handleCreate}
                disabled={isConnecting}
                className={`btn-game w-full rounded-lg py-3 px-6 border-b-[3px] text-sm font-black uppercase tracking-wider transition-all duration-200 ${
                  isConnecting
                    ? 'bg-[#e2e8f0] text-[#94a3b8] border-[#cbd5e1] cursor-not-allowed transform-none' 
                    : 'bg-[#f1f5f9] text-[#475569] border-[#cbd5e1] hover:bg-[#e2e8f0]'
                }`}
              >
                Create Your Private Room
              </button>
              
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-[#e2e8f0]" />
                <span className="text-[#94a3b8] text-[10px] font-black uppercase tracking-[0.2em]">Join via code</span>
                <div className="flex-1 h-px bg-[#e2e8f0]" />
              </div>

              <div className="grid grid-cols-5 gap-3">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABCD1"
                  maxLength={5}
                  className="col-span-3 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-lg px-4 py-3 text-[#0f172a] placeholder-[#94a3b8] uppercase focus:outline-none focus:border-[#a3e635] text-center tracking-[0.2em] font-black text-sm transition-all duration-200 shadow-inner"
                />
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={!code.trim() || isConnecting}
                  className={`col-span-2 rounded-lg py-3 px-2 border-b-[3px] text-sm font-black transition-all ${
                     !code.trim() || isConnecting
                       ? 'bg-[#e2e8f0] text-[#94a3b8] border-[#cbd5e1] cursor-not-allowed transform-none'
                       : 'bg-[#86efac] text-[#064e3b] border-[#22c55e] hover:bg-[#bbf7d0] hover:border-[#16a34a]'
                  }`}
                >
                  JOIN
                </button>
              </div>
          </div>
        </form>

        {state.error && (
          <div className="absolute -bottom-16 left-0 right-0 mx-auto w-full max-w-[90%] bg-[#ef4444] text-white font-bold text-sm text-center py-3 px-6 rounded-2xl border-2 border-[#b91c1c] shadow-[0_4px_0_#b91c1c] animate-bounce">
            ⚠️ {state.error}
          </div>
        )}
      </div>
      <div className="mt-6 mb-16">
        <HowToPlay />
      </div>

    </div>{/* end of main body div */}

    {/* Footer — separate from body, fixed to bottom of screen */}
    <footer className="bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-[#e2e8f0] mx-0 px-10 pt-2 pb-12.5 flex items-center justify-between gap-2">

      {/* Left — DrawLo brand + tagline (stacked on mobile, inline on wider) */}
      <div className="flex flex-col min-[430px]:flex-row min-[430px]:items-center min-[430px]:gap-3 shrink-0">
        <span className="font-black text-2xl text-[#0f172a] tracking-tight drop-shadow-[0_2px_0_rgba(163,230,53,0.8)]">
          Draw<span className="text-[#a3e635]">Lo</span>
        </span>

        {/* Tagline */}
        <span className="text-[11px] text-[#94a3b8] font-medium">
          Built with <span className="text-[#ef4444]">♥</span> by{' '}
          <span className="font-black text-[#475569]">Gargie</span>
        </span>
      </div>

      {/* Right — social icons */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Gmail */}
        <a
          href="mailto:gargiesingh321@gmail.com"
          title="Email"
          className="w-7 h-7 rounded-full border border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-center text-[#94a3b8] hover:text-[#ea4335] hover:border-[#ea4335] transition-colors duration-200"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
          </svg>
        </a>

        {/* LinkedIn */}
        <a
          href="https://www.linkedin.com/in/gargieesingh"
          target="_blank"
          rel="noopener noreferrer"
          title="LinkedIn"
          className="w-7 h-7 rounded-full border border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-center text-[#94a3b8] hover:text-[#0a66c2] hover:border-[#0a66c2] transition-colors duration-200"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>

        {/* X / Twitter */}
        <a
          href="https://x.com/gargieesingh"
          target="_blank"
          rel="noopener noreferrer"
          title="X (Twitter)"
          className="w-7 h-7 rounded-full border border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-center text-[#94a3b8] hover:text-[#0f172a] hover:border-[#0f172a] transition-colors duration-200"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.728-8.835L1.254 2.25H8.08l4.265 5.638 5.899-5.638Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
      </div>

    </footer>
    </>
  );
}
