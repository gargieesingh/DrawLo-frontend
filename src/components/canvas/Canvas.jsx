'use client';

import { useRef, useEffect, useLayoutEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useCanvas } from '../../hooks/useCanvas';
import { useRouter } from 'next/navigation';
import socket from '../../socket/socket';
import Toolbar from './Toolbar';

export default function Canvas() {
  const containerRef = useRef(null);
  const router = useRouter();
  const { state } = useGame();
  
  const { gameStatus, isMyTurn, currentTool, currentColor, currentSize, drawHistory } = state;
  const isDrawer = isMyTurn && gameStatus === 'drawing';

  const { canvasRef, setTool, setColor, setSize, replayHistory, undo } = useCanvas(isDrawer);

  // Expose undo globally so Toolbar can call it without prop drilling
  useEffect(() => {
    window.__drawlo_undo__ = undo;
    return () => { window.__drawlo_undo__ = null; };
  }, [undo]);

  useEffect(() => {
    setTool(currentTool);
  }, [currentTool, setTool]);

  useEffect(() => {
    setColor(currentColor);
  }, [currentColor, setColor]);

  useEffect(() => {
    setSize(currentSize);
  }, [currentSize, setSize]);

  // Initialise canvas dimensions and fill white synchronously so it is ready
  // before any socket-driven draw_history replay runs.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Replay draw history once the canvas is initialised.
  // drawHistory is stored in GameContext by useGameEvents (root level), so
  // it is already populated by the time this component mounts.
  useLayoutEffect(() => {
    if (drawHistory && drawHistory.length > 0) {
      replayHistory(drawHistory);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // run once on mount — history is captured before navigation completes

  let cursorClass = 'canvas-viewer';
  if (isDrawer) {
    cursorClass = state.currentTool === 'eraser' ? 'cursor-cell' : 'canvas-drawer';
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full relative group overflow-hidden">
      {/* On mobile: column layout (canvas top, toolbar below). On lg+: row layout (canvas left, toolbar right) */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-1.5 lg:gap-4 w-full">

        {/* Canvas Wrapper */}
        <div 
          ref={containerRef}
          className={`relative flex-1 bg-white rounded-2xl lg:rounded-3xl overflow-hidden transition-all duration-300 min-w-0 w-full h-full
            ${isDrawer ? 'border-[4px] lg:border-[6px] border-[#e94560] shadow-[0_8px_0_#9f1239] lg:shadow-[0_16px_0_#9f1239]' : 'border-[4px] lg:border-[6px] border-[#334155] shadow-[0_8px_0_#0f172a] lg:shadow-[0_12px_0_#0f172a]'}`}
          style={{ maxHeight: '100%', maxWidth: '100%', margin: '0 auto' }}
        >

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
          <div className="transition-all duration-300 w-full lg:w-auto lg:h-full lg:flex lg:items-center lg:justify-center shrink-0">
            <Toolbar />
          </div>
        )}

      </div>
    </div>
  );
}
