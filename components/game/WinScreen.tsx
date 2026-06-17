'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Crown, Medal, Sparkles, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Player } from '@/types/game';

interface WinScreenProps {
  winnerName: string;
  players: Record<string, Player>;
  autoStartDelaySeconds: number;
}

const ColumnWidth = 'w-[5.75rem] sm:w-[6.75rem]';

const placeConfig = {
  1: {
    height: 'h-40 sm:h-44',
    gradient:
      'bg-gradient-to-b from-amber-400/35 via-amber-500/20 to-amber-700/30 border-amber-300/50 shadow-[inset_0_1px_0_rgba(252,211,77,0.45),0_12px_40px_rgba(245,158,11,0.18)]',
    rank: 'bg-gradient-to-br from-amber-200 to-amber-500 text-amber-950 shadow-lg shadow-amber-500/30',
    ring: 'ring-amber-400/50',
    icon: Trophy,
  },
  2: {
    height: 'h-28 sm:h-32',
    gradient:
      'bg-gradient-to-b from-slate-300/25 via-slate-400/15 to-slate-600/25 border-slate-300/40 shadow-[inset_0_1px_0_rgba(226,232,240,0.35),0_10px_28px_rgba(148,163,184,0.15)]',
    rank: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 shadow-lg shadow-slate-400/25',
    ring: 'ring-slate-300/40',
    icon: Medal,
  },
  3: {
    height: 'h-24 sm:h-28',
    gradient:
      'bg-gradient-to-b from-orange-400/25 via-orange-600/15 to-orange-800/25 border-orange-400/35 shadow-[inset_0_1px_0_rgba(251,146,60,0.3),0_8px_24px_rgba(234,88,12,0.12)]',
    rank: 'bg-gradient-to-br from-orange-200 to-orange-500 text-orange-950 shadow-lg shadow-orange-500/20',
    ring: 'ring-orange-400/35',
    icon: Medal,
  },
} as const;

function fireWinConfetti() {
  const duration = 5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);

  return interval;
}

function PodiumSpot({
  player,
  place,
}: {
  player: Player | undefined;
  place: 1 | 2 | 3;
}) {
  const config = placeConfig[place];
  const Icon = config.icon;
  const empty = !player;

  return (
    <div className={cn('flex shrink-0 flex-col items-center', ColumnWidth)}>
      <div className="mb-3 flex h-[6.75rem] w-full flex-col items-center justify-end gap-1.5 text-center">
        {!empty ? (
          <>
            {place === 1 && (
              <Crown className="h-5 w-5 shrink-0 text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.6)]" />
            )}
            <span
              className={cn(
                'flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-xl ring-2',
                config.ring,
                place === 1 ? 'h-14 w-14 text-xl' : 'h-12 w-12 text-lg'
              )}
              style={{ background: player.color }}
            >
              {player.name.charAt(0).toUpperCase()}
            </span>
            <p className={cn('w-full truncate font-semibold leading-tight', place === 1 && 'text-sm')}>
              {player.name}
            </p>
            <p className="text-xs text-muted-foreground">{Math.round(player.progress)}%</p>
          </>
        ) : null}
      </div>

      <div
        className={cn(
          'relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-t-2xl border backdrop-blur-sm',
          config.height,
          config.gradient,
          empty && 'opacity-30'
        )}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-white/25" />
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
            config.rank
          )}
        >
          {place}
        </span>
        {!empty && <Icon className="h-4 w-4 text-foreground/70" />}
      </div>
    </div>
  );
}

export function WinScreen({ winnerName, players, autoStartDelaySeconds }: WinScreenProps) {
  const ranked = Object.values(players).sort((a, b) => b.progress - a.progress);
  const first = ranked[0];
  const second = ranked[1];
  const third = ranked[2];
  const [secondsLeft, setSecondsLeft] = useState(autoStartDelaySeconds);

  useEffect(() => {
    setSecondsLeft(autoStartDelaySeconds);
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [autoStartDelaySeconds]);

  useEffect(() => {
    const interval = fireWinConfetti();
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <Card className="glass-card relative overflow-hidden border-primary/40">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent" />
        <div className="pointer-events-none absolute -right-8 top-6 h-32 w-32 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-8 top-10 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />

        <CardHeader className="relative text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl">Gefeliciteerd, {winnerName}!</CardTitle>
          <CardDescription>Race afgelopen — dit is het podium</CardDescription>
        </CardHeader>

        <CardContent className="relative space-y-6">
          <div className="mx-auto w-fit max-w-full px-2">
            <div className="flex items-end justify-center gap-3 sm:gap-5">
              <PodiumSpot player={second} place={2} />
              <PodiumSpot player={first} place={1} />
              <PodiumSpot player={third} place={3} />
            </div>
            <div className="mt-1 h-2.5 rounded-full bg-gradient-to-r from-transparent via-border/80 to-transparent" />
            <div className="h-2 rounded-b-lg bg-muted/40" />
          </div>

          {ranked.length > 3 && (
            <ul className="space-y-2 rounded-xl border border-border/50 bg-muted/30 p-3">
              {ranked.slice(3).map((player, index) => (
                <li
                  key={player.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground">{index + 4}.</span>
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ background: player.color }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="font-medium">{player.name}</span>
                  </span>
                  <span className="text-muted-foreground">{Math.round(player.progress)}%</span>
                </li>
              ))}
            </ul>
          )}

          <p className="text-center text-sm text-muted-foreground">
            {secondsLeft > 0 ? (
              <>
                De volgende ronde start over{' '}
                <span className="font-semibold tabular-nums text-foreground">{secondsLeft}</span>{' '}
                {secondsLeft === 1 ? 'seconde' : 'seconden'} 
              </>
            ) : (
              'Terug naar de wachtkamer...'
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
