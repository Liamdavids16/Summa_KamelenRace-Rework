'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SafeRoom } from '@/types/game';

interface RoomCardProps {
  name: string;
  room: SafeRoom;
  maxPlayers: number;
  initialPlayerName?: string;
  onJoin: (roomName: string, playerName: string) => void;
}

export function RoomCard({
  name,
  room,
  maxPlayers,
  initialPlayerName = '',
  onJoin,
}: RoomCardProps) {
  const [open, setOpen] = useState(false);
  const [joinName, setJoinName] = useState(initialPlayerName);

  useEffect(() => {
    if (initialPlayerName) setJoinName(initialPlayerName);
  }, [initialPlayerName]);

  const statusLabel =
    room.status === 'playing' ? 'Bezig' : room.countdownStarted ? 'Countdown' : 'Lobby';
  const full = room.playerCount >= maxPlayers;
  const disabled = room.status === 'playing' || full;

  const handleOpen = () => {
    setJoinName(initialPlayerName);
    setOpen(true);
  };

  const handleConfirm = () => {
    const trimmed = joinName.trim();
    if (!trimmed) {
      toast.error('Vul je naam in');
      return;
    }
    onJoin(name, trimmed);
    setOpen(false);
  };

  return (
    <>
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
          onClick={handleOpen}
        >
          Deelnemen
        </Button>
      </CardContent>
    </Card>

    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deelnemen aan {name}</DialogTitle>
          <DialogDescription>Vul je naam in om mee te doen aan deze game.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 c">
          <Label htmlFor={`join-name-${name}`}>Naam</Label>
          <Input
            id={`join-name-${name}`}
            placeholder="Jouw naam (bijv. HackerHenk)"
            maxLength={15}
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuleren
          </Button>
          <Button className="theme-cta" onClick={handleConfirm} disabled={!joinName.trim()}>
            Deelnemen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
