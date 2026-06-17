'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
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
  initialPlayerName?: string;
  onJoin: (roomName: string, playerName: string) => void;
}

export function RoomCard({
  name,
  room,
  initialPlayerName = '',
  onJoin,
}: RoomCardProps) {
  const t = useTranslations('lobby');
  const tCommon = useTranslations('common');
  const tToast = useTranslations('toast');
  const [open, setOpen] = useState(false);
  const [joinName, setJoinName] = useState(initialPlayerName);

  useEffect(() => {
    if (initialPlayerName) setJoinName(initialPlayerName);
  }, [initialPlayerName]);

  const maxPlayers = room.settings?.maxPlayers ?? 8;
  const statusLabel =
    room.status === 'playing'
      ? t('statusPlaying')
      : room.countdownStarted
        ? t('statusCountdown')
        : t('statusLobby');
  const full = room.playerCount >= maxPlayers;
  const disabled = room.status === 'playing' || full;

  const handleOpen = () => {
    setJoinName(initialPlayerName);
    setOpen(true);
  };

  const handleConfirm = () => {
    const trimmed = joinName.trim();
    if (!trimmed) {
      toast.error(tToast('fillName'));
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
              ? t('categoryCount', { count: room.categories.length })
              : room.categories.join(', ') || t('noCategories')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between pt-0">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {t('playerCount', { current: room.playerCount, max: maxPlayers })}
          </span>
          <Button size="sm" className="theme-cta" disabled={disabled} onClick={handleOpen}>
            {tCommon('join')}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent variant="borderless">
          <DialogHeader>
            <DialogTitle>{t('joinRoom', { name })}</DialogTitle>
            <DialogDescription>{t('joinRoomDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 c">
            <Label htmlFor={`join-name-${name}`}>{tCommon('name')}</Label>
            <Input
              id={`join-name-${name}`}
              placeholder={tCommon('namePlaceholder')}
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
              {tCommon('cancel')}
            </Button>
            <Button className="theme-cta" onClick={handleConfirm} disabled={!joinName.trim()}>
              {tCommon('join')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
