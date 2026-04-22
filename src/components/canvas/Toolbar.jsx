'use client';

import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import socket from '../../socket/socket';

const PencilIcon = () => (
  <svg viewBox="0 0 100 100" className="w-[18px] h-[18px] lg:w-6 lg:h-6 drop-shadow-sm">
    <g transform="translate(50, 50) rotate(45) translate(-50, -50)">
      <polygon points="30,70 70,70 50,100" fill="#fde68a" stroke="#1e293b" strokeWidth="5" strokeLinejoin="round"/>
      <polygon points="43,89.5 57,89.5 50,100" fill="#1e293b" stroke="#1e293b" strokeWidth="2" strokeLinejoin="round"/>
      <rect x="30" y="30" width="40" height="40" fill="#fca5a5" stroke="#1e293b" strokeWidth="5" strokeLinejoin="round"/>
      <rect x="43" y="30" width="14" height="40" fill="#ef4444" />
      <rect x="28" y="20" width="44" height="10" rx="3" fill="#f8fafc" stroke="#1e293b" strokeWidth="5" strokeLinejoin="round" />
      <path d="M 30 20 L 30 10 C 30 4 35 2 50 2 C 65 2 70 4 70 10 L 70 20 Z" fill="#f43f5e" stroke="#1e293b" strokeWidth="5" strokeLinejoin="round" />
    </g>
  </svg>
);

const EraserIcon = () => (
  <svg viewBox="0 0 100 100" className="w-[20px] h-[20px] lg:w-7 lg:h-7 drop-shadow-sm">
    <g transform="translate(50, 50) rotate(-35) translate(-50, -50)">
      <path d="M 15 35 L 50 35 L 50 65 L 15 65 C 5 65 5 35 15 35 Z" fill="#f8fafc" stroke="#1e293b" strokeWidth="5" strokeLinejoin="round" />
      <path d="M 50 35 L 80 35 C 90 35 90 65 80 65 L 50 65 Z" fill="#3b82f6" stroke="#1e293b" strokeWidth="5" strokeLinejoin="round" />
      <line x1="50" y1="35" x2="50" y2="65" stroke="#1e293b" strokeWidth="5" />
    </g>
  </svg>
);

const FillIcon = () => (
  <svg viewBox="0 0 100 100" className="w-[18px] h-[18px] lg:w-6 lg:h-6 drop-shadow-sm">
    {/* Paint bucket body */}
    <g transform="translate(4, 2)">
      {/* Bucket shape */}
      <path d="M 20 30 L 14 75 C 13 82 19 88 26 88 L 56 88 C 63 88 69 82 68 75 L 62 30 Z"
        fill="#60a5fa" stroke="#1e293b" strokeWidth="5" strokeLinejoin="round" />
      {/* Bucket top rim */}
      <rect x="16" y="25" width="50" height="9" rx="4"
        fill="#f8fafc" stroke="#1e293b" strokeWidth="5" strokeLinejoin="round" />
      {/* Handle arc */}
      <path d="M 30 25 C 30 10 52 10 52 25"
        fill="none" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
      {/* Paint drip */}
      <path d="M 76 20 C 90 34 90 50 76 56 C 62 50 62 34 76 20 Z"
        fill="#f43f5e" stroke="#1e293b" strokeWidth="3.5" strokeLinejoin="round" />
      <line x1="76" y1="20" x2="50" y2="50" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
    </g>
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Handle */}
    <path d="M9 3h6" />
    {/* Lid */}
    <path d="M3 6h18" />
    {/* Bucket body */}
    <path d="M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" />
    {/* 3 vertical lines */}
    <line x1="10" y1="10" x2="10" y2="18" />
    <line x1="12" y1="10" x2="12" y2="18" />
    <line x1="14" y1="10" x2="14" y2="18" />
  </svg>
);

const COLORS = [
  '#000000','#ffffff','#ef4444','#f97316','#eab308','#22c55e',
  '#06b6d4','#3b82f6','#8b5cf6','#ec4899','#92400e','#6b7280',
  '#fca5a5','#86efac','#93c5fd','#c4b5fd'
];

const BRUSH_SIZES = [
  { val: 2, dot: 4 },
  { val: 5, dot: 6 },
  { val: 12, dot: 12 },
  { val: 25, dot: 20 }
];

export default function Toolbar() {
  const { state, dispatch } = useGame();
  const { currentColor, currentSize, currentTool } = state;
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleSizeSelect = (size) => {
    dispatch({ type: 'SET_SIZE', size });
    setShowSizePicker(false);
  };

  const handleToolSelect = (tool) => {
    if (currentTool === tool) {
      setShowSizePicker(!showSizePicker);
    } else {
      dispatch({ type: 'SET_TOOL', tool });
      setShowSizePicker(true);
    }
  };

  const renderSizePicker = (position) => (
    <div className={`absolute ${position} bg-white border-2 border-[#e2e8f0] rounded-2xl p-1.5 shadow-lg flex flex-col gap-2 animate-in fade-in slide-in-from-right-2 duration-200 z-50`}>
      {BRUSH_SIZES.map((size) => (
        <div
          key={size.val}
          onClick={() => handleSizeSelect(size.val)}
          className={`flex items-center justify-center cursor-pointer w-7 h-7 rounded-full transition-all duration-200 shrink-0
            ${currentSize === size.val ? 'border-[3px] border-[#84cc16] bg-[#f0fdf4] scale-110' : 'border border-[#e2e8f0] hover:bg-[#f1f5f9] bg-white'}`}
        >
          <div className="bg-[#0f172a] rounded-full pointer-events-none" style={{ width: size.dot, height: size.dot }} />
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* ── MOBILE: horizontal toolbar below canvas ── */}
      <div className="lg:hidden relative">

        {/* Color picker popover — appears above the toolbar */}
        {showColorPicker && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border-2 border-[#e2e8f0] rounded-2xl p-3 shadow-xl z-50 w-[220px] animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Colors grid */}
            <div className="grid grid-cols-8 gap-1.5">
              {COLORS.map((color) => (
                <div
                  key={color}
                  onClick={() => {
                    dispatch({ type: 'SET_COLOR', color });
                    if (currentTool === 'eraser') dispatch({ type: 'SET_TOOL', tool: 'pen' });
                    setShowColorPicker(false);
                  }}
                  className={`w-6 h-6 rounded-full cursor-pointer transition-transform duration-150 shadow-[0_2px_0_rgba(0,0,0,0.15)] shrink-0
                    ${currentColor === color ? 'scale-110 border-[2.5px] border-[#0f172a] z-10' : 'border border-transparent hover:scale-110 hover:border-[#94a3b8]'}`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* Single horizontal strip */}
        <div className="flex items-center gap-1.5 bg-white rounded-xl px-2 py-1.5 border-2 border-[#e2e8f0] shadow-sm w-full justify-between">

          {/* Pen */}
          <div className="relative">
            <button
              onClick={() => handleToolSelect('pen')}
              title="Pen"
              className={`btn-game w-8 h-8 rounded-lg flex items-center justify-center border-b-[2px]
                ${currentTool === 'pen' ? 'bg-[#a3e635] text-[#064e3b] border-[#65a30d]' : 'bg-[#f8fafc] text-[#475569] border-[#e2e8f0] hover:bg-[#e2e8f0]'}`}
            ><PencilIcon /></button>
            {showSizePicker && currentTool === 'pen' && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border-2 border-[#e2e8f0] rounded-2xl p-1.5 shadow-lg flex gap-2 z-50">
                {BRUSH_SIZES.map((size) => (
                  <div key={size.val} onClick={() => handleSizeSelect(size.val)}
                    className={`flex items-center justify-center cursor-pointer w-7 h-7 rounded-full transition-all shrink-0
                      ${currentSize === size.val ? 'border-[3px] border-[#84cc16] bg-[#f0fdf4] scale-110' : 'border border-[#e2e8f0] hover:bg-[#f1f5f9] bg-white'}`}>
                    <div className="bg-[#0f172a] rounded-full pointer-events-none" style={{ width: size.dot, height: size.dot }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Eraser */}
          <div className="relative">
            <button
              onClick={() => handleToolSelect('eraser')}
              title="Eraser"
              className={`btn-game w-8 h-8 rounded-lg flex items-center justify-center border-b-[2px]
                ${currentTool === 'eraser' ? 'bg-[#a3e635] text-[#064e3b] border-[#65a30d]' : 'bg-[#f8fafc] text-[#475569] border-[#e2e8f0] hover:bg-[#e2e8f0]'}`}
            ><EraserIcon /></button>
            {showSizePicker && currentTool === 'eraser' && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border-2 border-[#e2e8f0] rounded-2xl p-1.5 shadow-lg flex gap-2 z-50">
                {BRUSH_SIZES.map((size) => (
                  <div key={size.val} onClick={() => handleSizeSelect(size.val)}
                    className={`flex items-center justify-center cursor-pointer w-7 h-7 rounded-full transition-all shrink-0
                      ${currentSize === size.val ? 'border-[3px] border-[#84cc16] bg-[#f0fdf4] scale-110' : 'border border-[#e2e8f0] hover:bg-[#f1f5f9] bg-white'}`}>
                    <div className="bg-[#0f172a] rounded-full pointer-events-none" style={{ width: size.dot, height: size.dot }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fill */}
          <button
            onClick={() => {
              dispatch({ type: 'SET_TOOL', tool: 'fill' });
              setShowSizePicker(false);
              setShowColorPicker(false);
            }}
            title="Fill Color"
            className={`btn-game w-8 h-8 rounded-lg flex items-center justify-center border-b-[2px]
              ${currentTool === 'fill' ? 'bg-[#a3e635] text-[#064e3b] border-[#65a30d]' : 'bg-[#f8fafc] text-[#475569] border-[#e2e8f0] hover:bg-[#e2e8f0]'}`}
          ><FillIcon /></button>

          {/* Color Palette button — shows active color, opens picker */}
          <button
            onClick={() => { setShowColorPicker(!showColorPicker); setShowSizePicker(false); }}
            title="Color Palette"
            className={`btn-game w-8 h-8 rounded-lg flex items-center justify-center border-b-[2px] shrink-0
              ${showColorPicker ? 'border-[#65a30d] bg-[#f0fdf4]' : 'border-[#e2e8f0] bg-[#f8fafc] hover:bg-[#e2e8f0]'}`}
          >
            <span className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-[#1e293b] shadow-sm" style={{ backgroundColor: currentColor }} />
          </button>

          {/* Clear */}
          <button
            onClick={() => { socket.emit('clear_canvas'); setShowColorPicker(false); }}
            title="Clear Canvas"
            className="btn-game w-8 h-8 rounded-lg flex items-center justify-center bg-[#ef4444] text-white border-b-[2px] border-[#b91c1c] hover:bg-[#f87171]"
          ><TrashIcon /></button>

        </div>
      </div>

      {/* ── LARGE SCREENS: vertical toolbar right of canvas ── */}
      <div className="hidden lg:flex flex-col bg-white rounded-[24px] p-3 items-center justify-between gap-4 shadow-sm border-2 border-[#e2e8f0] h-max relative z-20 shrink-0 mx-0 my-auto">

        {/* Tools Group */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="relative">
            <button
              onClick={() => handleToolSelect('pen')}
              title="Pen"
              className={`btn-game px-3 py-2.5 rounded-2xl flex items-center justify-center
                ${currentTool === 'pen' ? 'bg-[#a3e635] text-[#064e3b] border-b-[4px] border-[#65a30d]' : 'bg-[#f8fafc] text-[#475569] border-b-[4px] border-[#e2e8f0] hover:bg-[#e2e8f0]'}`}
            ><PencilIcon /></button>
            {showSizePicker && currentTool === 'pen' && renderSizePicker('right-full top-0 mr-4')}
          </div>

          <div className="relative">
            <button
              onClick={() => handleToolSelect('eraser')}
              title="Eraser"
              className={`btn-game px-3 py-2.5 rounded-2xl flex items-center justify-center
                ${currentTool === 'eraser' ? 'bg-[#a3e635] text-[#064e3b] border-b-[4px] border-[#65a30d]' : 'bg-[#f8fafc] text-[#475569] border-b-[4px] border-[#e2e8f0] hover:bg-[#e2e8f0]'}`}
            ><EraserIcon /></button>
            {showSizePicker && currentTool === 'eraser' && renderSizePicker('right-full top-0 mr-4')}
          </div>

          {/* Fill */}
          <div className="relative">
            <button
              onClick={() => {
                dispatch({ type: 'SET_TOOL', tool: 'fill' });
                setShowSizePicker(false);
              }}
              title="Fill Color"
              className={`btn-game px-3 py-2.5 rounded-2xl flex items-center justify-center
                ${currentTool === 'fill' ? 'bg-[#a3e635] text-[#064e3b] border-b-[4px] border-[#65a30d]' : 'bg-[#f8fafc] text-[#475569] border-b-[4px] border-[#e2e8f0] hover:bg-[#e2e8f0]'}`}
            ><FillIcon /></button>
          </div>
        </div>

        <div className="h-1.5 w-10 bg-[#e2e8f0] rounded-full shrink-0"></div>

        {/* Colors — grid */}
        <div className="grid grid-cols-2 gap-2">
          {COLORS.map((color) => (
            <div
              key={color}
              onClick={() => {
                dispatch({ type: 'SET_COLOR', color });
                if (currentTool === 'eraser') dispatch({ type: 'SET_TOOL', tool: 'pen' });
                setShowSizePicker(false);
              }}
              className={`w-7 h-7 rounded-full cursor-pointer transition-transform duration-200 shadow-[0_2px_0_rgba(0,0,0,0.1)] shrink-0
                ${currentColor === color && (currentTool === 'pen' || currentTool === 'fill') ? 'scale-125 border-[3px] border-[#0f172a] z-10' : 'border-2 border-transparent hover:scale-110 hover:border-[#94a3b8]'}`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        <div className="h-1.5 w-10 bg-[#e2e8f0] rounded-full shrink-0 mx-auto"></div>

        {/* Clear */}
        <button
          onClick={() => socket.emit('clear_canvas')}
          title="Clear Canvas"
          className="btn-game bg-[#ef4444] text-white hover:bg-[#f87171] border-b-[4px] border-[#b91c1c] rounded-2xl px-4 py-2.5 font-black text-lg flex items-center shrink-0"
        >🗑️</button>

      </div>
    </>
  );
}
