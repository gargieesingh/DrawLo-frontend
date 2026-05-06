'use client';

import { useGame } from '../../context/GameContext';
import PlayerCard from './PlayerCard';

export default function PlayerList() {
  const { state } = useGame();
  const { players, currentDrawer, gameStatus } = state;

  // Sort players by score descending during game
  const displayPlayers = [...players].sort((a, b) => {
    if (gameStatus === 'waiting') return 0;
    return b.score - a.score;
  });

  return (
    <div className="w-full flex-col flex">
      {displayPlayers.map((player, idx) => {
        const isDrawing = currentDrawer?.id === player.id;
        const playerIsHost = state.roomCode && state.players[0]?.id === player.id; 

        return (
          <PlayerCard
            key={player.id}
            player={player}
            index={idx}
            rank={gameStatus !== 'waiting' ? idx + 1 : null}
            isDrawing={isDrawing}
            isHost={playerIsHost}
          />
        );
      })}
    </div>
  );
}
