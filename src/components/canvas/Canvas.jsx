'use client';

import { useRef, useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useCanvas } from '../../hooks/useCanvas';
import { useRouter } from 'next/navigation';
import socket from '../../socket/socket';
import Toolbar from './Toolbar';

export default function Canvas() {
  const containerRef = useRef(null);
  const router = useRouter();
  const { state } = useGame();
  
  const { gameStatus, isMyTurn, currentTool, currentColor, currentSize } = state;
  const isDrawer = isMyTurn && gameStatus === 'drawing';

  const { canvasRef, setTool, setColor, setSize } = useCanvas(isDrawer);

  useEffect(() => {
    setTool(currentTool);
  }, [currentTool, setTool]);

  useEffect(() => {
    setColor(currentColor);
  }, [currentColor, setColor]);

  useEffect(() => {
    setSize(currentSize);
  }, [currentSize, setSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 800;
      canvas.height = 600;
      // White base
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  let cursorClass = 'canvas-viewer';
  if (isDrawer) {
    cursorClass = state.currentTool === 'eraser' ? 'cursor-cell' : 'canvas-drawer';
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full relative group overflow-hidden">
      {/* On mobile: column layout (canvas top, toolbar below). On lg+: column (canvas top, toolbar below) */}
      <div className="flex flex-col flex-1 min-h-0 gap-1.5 lg:gap-0 w-full">

        {/* Canvas Wrapper */}
        <div 
          ref={containerRef}
          className={`relative flex-1 bg-white rounded-2xl lg:rounded-3xl overflow-hidden transition-all duration-300 min-w-0 w-full
            ${isDrawer ? 'border-[4px] lg:border-[6px] border-[#e94560] shadow-[0_8px_0_#9f1239] lg:shadow-[0_16px_0_#9f1239]' : 'border-[4px] lg:border-[6px] border-[#334155] shadow-[0_8px_0_#0f172a] lg:shadow-[0_12px_0_#0f172a]'}`}
          style={{ maxHeight: '100%', maxWidth: '100%', margin: '0 auto' }}
        >
          {isDrawer && (
            <div className="absolute top-2 left-2 lg:top-4 lg:left-4 bg-[#f7b731] text-[#713f12] text-[9px] lg:text-sm font-black px-2 lg:px-4 py-1 lg:py-2 rounded-full shadow-[0_4px_0_#a16207] z-10 uppercase tracking-widest pointer-events-none transform -rotate-2">
              🎨 <span className="hidden lg:inline">You are sketching!</span>
            </div>
          )}

          <canvas
            ref={canvasRef}
            className={`w-full h-full bg-white touch-none ${cursorClass}`}
          />

          {gameStatus === 'waiting' && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white text-sm lg:text-2xl font-black tracking-widest uppercase text-center bg-[#4c1d95] px-4 lg:px-8 py-2 lg:py-4 rounded-full border-4 border-[#7c3aed] shadow-[0_8px_0_#2e1065] animate-pulse">
                Waiting for Game to Start
              </span>
            </div>
          )}
        </div>

        {/* Toolbar — shown only when drawing */}
        {isDrawer && (
          <div className={`transition-all duration-300 lg:mt-6`}>
            <Toolbar />
          </div>
        )}

      </div>
    </div>
  );
}
