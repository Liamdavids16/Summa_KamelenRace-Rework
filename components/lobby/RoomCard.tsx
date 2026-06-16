'use client';

import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SafeRoom } from '@/types/game';

interface RoomCardProps {
  name: string;
  room: SafeRoom;
  maxPlayers: number;
  onJoin: (name: string) => void;
}

export function RoomCard({ name, room, maxPlayers, onJoin }: RoomCardProps) {
  const statusLabel =
    room.status === 'playing' ? 'Bezig' : room.countdownStarted ? 'Countdown' : 'Lobby';
  const full = room.playerCount >= maxPlayers;
  const disabled = room.status === 'playing' || full;

  return (
    <Card className="glass-card transition-all hover:shadow-2xl">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold">{name}</CardTitle>
          <Badge variant="secondary" className="shrink-0 font-normal">
            {statusLabel}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2 text-xs">
          {room.categories.length > 2
            ? `${room.categories.length} categorieën`
            : room.categories.join(', ') || 'Geen categorieën'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between pt-0">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {room.playerCount} / {maxPlayers} spelers
        </span>
        <Button
          size="sm"
          className="theme-cta"
          disabled={disabled}
          onClick={() => onJoin(name)}
        >
          Deelnemen
        </Button>
      </CardContent>
    </Card>
  );
}
