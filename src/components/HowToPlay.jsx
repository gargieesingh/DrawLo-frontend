'use client';

import { useState } from 'react';

const steps = [
  {
    number: '01',
    title: 'Choose a Word',
    description: "When it's your turn, pick one of 3 secret words to draw.",
    illustration: <SlideChooseWord />,
  },
  {
    number: '02',
    title: 'Draw It!',
    description: 'Sketch your word on the canvas — no spelling allowed!',
    illustration: <SlideDrawWord />,
  },
  {
    number: '03',
    title: 'Others Guess',
    description: 'Other players try to guess your drawing in the chat.',
    illustration: <SlideOthersGuess />,
  },
  {
    number: '04',
    title: 'Guess the Drawing',
    description: "When others draw, type your guess — fastest gets more points!",
    illustration: <SlideGuess />,
  },
  {
    number: '05',
    title: 'Win the Game',
    description: 'Most points at the end wins the crown!',
    illustration: <SlideWinner />,
  },
];

export default function HowToPlay() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeStep = steps[currentIndex];

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < steps.length - 1) setCurrentIndex(currentIndex + 1);
  };

  return (
    <section className="w-full max-w-md mx-auto pb-8">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <div className="flex-1 h-px bg-[#e2e8f0]" />
        <span className="text-[#475569] font-black text-xs uppercase tracking-[0.25em]">How to Play</span>
        <div className="flex-1 h-px bg-[#e2e8f0]" />
      </div>

      {/* Carousel Container */}
      <div className="flex items-center justify-center gap-3 sm:gap-6">
        {/* Prev Button */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center bg-white border-2 border-[#e2e8f0] text-[#475569] shadow-[0_2px_0_#e2e8f0] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f8fafc] hover:-translate-y-0.5 hover:border-[#cbd5e1] hover:shadow-[0_4px_0_#cbd5e1] transition-all active:translate-y-0 active:shadow-none"
          aria-label="Previous step"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 fill-none stroke-current stroke-[3]" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        {/* Active Card */}
        <div
          className="shrink-0 w-60 sm:w-72 bg-white border-2 border-[#e2e8f0] rounded-3xl p-3 sm:p-4 shadow-[0_4px_0_#e2e8f0] flex flex-col items-center gap-2 sm:gap-3 hover:-translate-y-1 hover:border-[#a3e635] hover:shadow-[0_6px_0_rgba(163,230,53,0.5)] transition-all duration-200"
        >
          {/* Illustration */}
          <div className="w-full rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] overflow-hidden flex items-center justify-center"
            style={{ height: 140 }}>
            {activeStep.illustration}
          </div>

          {/* Step number badge */}
          <div className="self-start bg-[#a3e635] text-[#064e3b] font-black text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-[#65a30d]">
            {activeStep.number}
          </div>

          {/* Title */}
          <p className="text-[#0f172a] font-black text-sm sm:text-base text-center leading-tight w-full">
            {activeStep.title}
          </p>

          {/* Description */}
          <p className="text-[#64748b] text-[10px] sm:text-xs text-center leading-relaxed min-h-[40px] flex items-center justify-center">
            {activeStep.description}
          </p>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentIndex === steps.length - 1}
          className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center bg-white border-2 border-[#e2e8f0] text-[#475569] shadow-[0_2px_0_#e2e8f0] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f8fafc] hover:-translate-y-0.5 hover:border-[#cbd5e1] hover:shadow-[0_4px_0_#cbd5e1] transition-all active:translate-y-0 active:shadow-none"
          aria-label="Next step"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 fill-none stroke-current stroke-[3]" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center items-center gap-2 mt-6">
        {steps.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-5 bg-[#a3e635]' : 'w-2 bg-[#cbd5e1] hover:bg-[#94a3b8]'}`}
            aria-label={`Go to step ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

/* ─── Slide Illustrations ──────────────────────────────────────────────────── */

function SlideChooseWord() {
  return (
    <svg viewBox="0 0 160 110" className="w-full h-full" style={{ fontFamily: 'inherit' }}>
      <text x="80" y="26" textAnchor="middle" fontSize="13" fontWeight="900" fill="#0f172a">CHOOSE A</text>
      <text x="80" y="42" textAnchor="middle" fontSize="13" fontWeight="900" fill="#0f172a">WORD!</text>
      {/* Left card */}
      <rect x="8" y="52" width="38" height="24" rx="6" fill="white" stroke="#0f172a" strokeWidth="1.5"/>
      <line x1="14" y1="61" x2="40" y2="61" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="69" x2="38" y2="69" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Middle card — highlighted */}
      <rect x="61" y="48" width="38" height="28" rx="6" fill="#f0fdf4" stroke="#a3e635" strokeWidth="2"/>
      <text x="80" y="66" textAnchor="middle" fontSize="8" fontWeight="900" fill="#064e3b">HOUSE</text>
      {/* Right card */}
      <rect x="114" y="52" width="38" height="24" rx="6" fill="white" stroke="#0f172a" strokeWidth="1.5"/>
      <line x1="120" y1="61" x2="146" y2="61" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"/>
      <line x1="122" y1="69" x2="144" y2="69" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Hand */}
      <text x="80" y="100" textAnchor="middle" fontSize="16">👆</text>
    </svg>
  );
}

function SlideDrawWord() {
  return (
    <svg viewBox="0 0 160 110" className="w-full h-full">
      {/* House */}
      <polyline points="38,62 80,28 122,62" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="46" y="62" width="68" height="42" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
      <rect x="71" y="78" width="18" height="26" rx="2" fill="none" stroke="#0f172a" strokeWidth="1.5"/>
      <rect x="52" y="70" width="16" height="14" rx="2" fill="none" stroke="#0f172a" strokeWidth="1.5"/>
      <line x1="60" y1="70" x2="60" y2="84" stroke="#0f172a" strokeWidth="1"/>
      <line x1="52" y1="77" x2="68" y2="77" stroke="#0f172a" strokeWidth="1"/>
      {/* Pencil */}
      <g transform="translate(124, 24) rotate(30)">
        <rect x="-5" y="-14" width="10" height="20" rx="2" fill="#f7b731" stroke="#0f172a" strokeWidth="1.5"/>
        <polygon points="-5,6 5,6 0,14" fill="#fde68a" stroke="#0f172a" strokeWidth="1.5"/>
        <rect x="-5" y="-14" width="10" height="5" rx="1.5" fill="#fda4af" stroke="#0f172a" strokeWidth="1.5"/>
      </g>
    </svg>
  );
}

function SlideOthersGuess() {
  return (
    <svg viewBox="0 0 160 110" className="w-full h-full">
      {/* Three stick figures */}
      {[0,1,2].map(i => (
        <g key={i} transform={`translate(16, ${18 + i * 28})`}>
          <circle cx="10" cy="0" r="8" fill="white" stroke="#0f172a" strokeWidth="1.5"/>
          <circle cx="7" cy="-2" r="1.2" fill="#0f172a"/>
          <circle cx="13" cy="-2" r="1.2" fill="#0f172a"/>
          <path d="M7,3 Q10,6 13,3" fill="none" stroke="#0f172a" strokeWidth="1" strokeLinecap="round"/>
          <rect x="20" y="-8" width="16" height="12" rx="4" fill="#a3e635" stroke="#65a30d" strokeWidth="1"/>
          <text x="28" y="0" textAnchor="middle" fontSize="8" fontWeight="900" fill="#064e3b">?</text>
          <polygon points="22,-1 18,5 26,2" fill="#a3e635"/>
        </g>
      ))}
      {/* Divider */}
      <line x1="60" y1="10" x2="60" y2="100" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4,3"/>
      {/* House */}
      <polyline points="74,62 104,36 134,62" fill="none" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="80" y="62" width="48" height="32" fill="none" stroke="#0f172a" strokeWidth="1.5"/>
      <rect x="97" y="76" width="14" height="18" rx="1" fill="none" stroke="#0f172a" strokeWidth="1.2"/>
      <rect x="85" y="67" width="11" height="10" rx="1" fill="none" stroke="#0f172a" strokeWidth="1.2"/>
      <rect x="80" y="25" width="44" height="13" rx="4" fill="#f0fdf4" stroke="#a3e635" strokeWidth="1.5"/>
      <text x="102" y="35" textAnchor="middle" fontSize="7" fontWeight="900" fill="#064e3b">HOUSE</text>
    </svg>
  );
}

function SlideGuess() {
  return (
    <svg viewBox="0 0 160 110" className="w-full h-full">
      {/* Pear body */}
      <path
        d="M42,18 C50,18 58,26 59,38 C61,50 61,62 58,74 C55,85 49,94 42,96 C35,94 29,85 26,74 C23,62 23,50 25,38 C26,26 34,18 42,18 Z"
        fill="#c8d92c" stroke="#1a0800" strokeWidth="2.5" strokeLinejoin="round"
      />
      {/* Stem */}
      <path d="M42,18 C42,12 43,8 44,4" fill="none" stroke="#5c3a10" strokeWidth="2" strokeLinecap="round"/>
      {/* Leaf */}
      <ellipse cx="38" cy="6" rx="9" ry="5" fill="#2a8a3e" stroke="#1a0800" strokeWidth="1.5" transform="rotate(-40 38 6)"/>
      {/* Highlights */}
      <circle cx="31" cy="36" r="3.5" fill="white" opacity="0.6"/>
      <circle cx="28" cy="46" r="2.5" fill="white" opacity="0.5"/>
      {/* Speckles */}
      <circle cx="53" cy="76" r="2" fill="#1a0800" opacity="0.4"/>
      <circle cx="57" cy="83" r="1.5" fill="#1a0800" opacity="0.35"/>

      {/* Divider */}
      <line x1="80" y1="8" x2="80" y2="102" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4,3"/>

      {/* Guess lines */}
      <line x1="92" y1="38" x2="150" y2="38" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
      <line x1="92" y1="55" x2="148" y2="55" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
      <line x1="92" y1="72" x2="142" y2="72" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
      {/* PEAR box */}
      <rect x="96" y="82" width="44" height="18" rx="5" fill="#f0fdf4" stroke="#a3e635" strokeWidth="1.5"/>
      <text x="118" y="95" textAnchor="middle" fontSize="8" fontWeight="900" fill="#064e3b">PEAR</text>
    </svg>
  );
}

function SlideWinner() {
  return (
    <svg viewBox="0 0 160 110" className="w-full h-full">
      <text x="80" y="20" textAnchor="middle" fontSize="16" fontWeight="900" fill="#0f172a" letterSpacing="1">WINNER!</text>
      {/* Crown */}
      <polygon points="54,44 62,33 70,40 78,28 86,40 94,33 102,44" fill="#f7b731" stroke="#0f172a" strokeWidth="1.5"/>
      <rect x="54" y="42" width="48" height="8" rx="2" fill="#f7b731" stroke="#0f172a" strokeWidth="1.5"/>
      {/* Head */}
      <circle cx="78" cy="62" r="12" fill="white" stroke="#0f172a" strokeWidth="2"/>
      <circle cx="74" cy="59" r="1.8" fill="#0f172a"/>
      <circle cx="82" cy="59" r="1.8" fill="#0f172a"/>
      <path d="M73,66 Q78,71 83,66" fill="none" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Body */}
      <line x1="78" y1="74" x2="78" y2="96" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
      <line x1="78" y1="80" x2="60" y2="70" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
      <line x1="78" y1="80" x2="96" y2="70" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
      <line x1="78" y1="96" x2="66" y2="110" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
      <line x1="78" y1="96" x2="90" y2="110" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
      {/* #1 badge */}
      <circle cx="124" cy="76" r="14" fill="#a3e635" stroke="#65a30d" strokeWidth="1.5"/>
      <text x="124" y="81" textAnchor="middle" fontSize="10" fontWeight="900" fill="#064e3b">#1</text>
      {/* Stars */}
      <text x="30" y="78" fontSize="10" fill="#f7b731">★</text>
      <text x="136" y="50" fontSize="9" fill="#a3e635">✦</text>
    </svg>
  );
}
