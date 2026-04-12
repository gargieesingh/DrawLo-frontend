'use client';

import './globals.css';
import { GameProvider } from '../context/GameContext';
import { useGameEvents } from '../hooks/useGameEvents';

// Mounts socket listeners once inside GameProvider context
function GameEventManager() {
  useGameEvents();
  return null;
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <GameProvider>
          <GameEventManager />
          {children}
        </GameProvider>
      </body>
    </html>
  );
}
