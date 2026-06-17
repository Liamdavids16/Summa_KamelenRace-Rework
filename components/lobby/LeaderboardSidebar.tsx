'use client';

import { useTranslations } from 'next-intl';
import { Medal, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Leaderboard } from '@/types/game';

interface LeaderboardSidebarProps {
  leaderboard: Leaderboard;
}

const topRankStyles = [
  {
    badge: 'bg-amber-400/20 text-amber-300 ring-amber-400/50',
    row: 'ring-1 ring-amber-400/20',
    icon: Trophy,
  },
  {
    badge: 'bg-slate-400/20 text-slate-200 ring-slate-400/40',
    row: 'ring-1 ring-slate-400/15',
    icon: Medal,
  },
  {
    badge: 'bg-orange-500/20 text-orange-200 ring-orange-400/40',
    row: 'ring-1 ring-orange-400/15',
    icon: Medal,
  },
] as const;

export function LeaderboardSidebar({ leaderboard }: LeaderboardSidebarProps) {
  const t = useTranslations('leaderboard');
  const sorted = Object.entries(leaderboard).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <Card className="glass-card h-fit lg:sticky lg:top-28">
      <CardHeader className="pb-3 pt-5">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Trophy className="h-4 w-4 text-primary" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="scrollbar-hidden max-h-80 overflow-y-auto overscroll-y-contain pt-1 [-webkit-overflow-scrolling:touch]">
          {sorted.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            <ul className="space-y-1.5">
              {sorted.map(([name, wins], index) => {
                const topStyle = index < 3 ? topRankStyles[index] : null;
                const RankIcon = topStyle?.icon;

                return (
                  <li
                    key={name}
                    className={cn(
                      'flex items-center justify-between rounded-lg bg-muted px-3 py-2.5 text-sm',
                      topStyle?.row
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2.5 font-medium">
                      {topStyle ? (
                        <span
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1',
                            topStyle.badge
                          )}
                        >
                          {index + 1}
                        </span>
                      ) : (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center text-xs text-muted-foreground">
                          {index + 1}
                        </span>
                      )}
                      <span className="truncate">{name}</span>
                      {topStyle && RankIcon && (
                        <RankIcon
                          className={cn(
                            'h-3.5 w-3.5 shrink-0 opacity-80',
                            index === 0 && 'text-amber-300',
                            index === 1 && 'text-slate-300',
                            index === 2 && 'text-orange-300'
                          )}
                        />
                      )}
                    </span>
                    <span className="shrink-0 rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                      {t('wins', { count: wins })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
