'use client';

import type { Player } from '@/types/game';
import { Progress } from '@/components/ui/progress';

interface RaceTrackProps {
  players: Record<string, Player>;
}

export function RaceTrack({ players }: RaceTrackProps) {
  const list = Object.values(players);

  if (list.length === 0) {
    return <p className="text-sm text-muted-foreground">Wachten op racers...</p>;
  }

  return (
    <div className="space-y-4">
      {list.map((player) => (
        <div key={player.id} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium" style={{ color: player.color }}>
              {player.name}
            </span>
            <span className="text-muted-foreground">{Math.round(player.progress)}%</span>
          </div>
          <Progress value={player.progress} className="h-2" />
        </div>
      ))}
    </div>
  );
}
