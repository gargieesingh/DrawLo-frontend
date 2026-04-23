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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
      </head>
      <body>
        <GameProvider>
          <GameEventManager />
          {children}
        </GameProvider>
      </body>
    </html>
  );
}
