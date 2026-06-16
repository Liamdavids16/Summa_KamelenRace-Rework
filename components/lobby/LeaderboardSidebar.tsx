'use client';

import { Medal, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Leaderboard } from '@/types/game';

interface LeaderboardSidebarProps {
  leaderboard: Leaderboard;
}

export function LeaderboardSidebar({ leaderboard }: LeaderboardSidebarProps) {
  const sorted = Object.entries(leaderboard).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <Card className="glass-card h-fit lg:sticky lg:top-28">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Trophy className="h-4 w-4 text-primary" />
          Top Racers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-80 pr-2">
          {sorted.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nog geen winnaars.</p>
          ) : (
            <ul className="space-y-1.5">
              {sorted.map(([name, wins], index) => (
                <li
                  key={name}
                  className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5 text-sm"
                >
                  <span className="flex items-center gap-2 font-medium">
                    {index < 3 ? (
                      <Medal className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <span className="w-3.5 text-center text-xs text-muted-foreground">
                        {index + 1}
                      </span>
                    )}
                    <span className="truncate">{name}</span>
                  </span>
                  <span className="shrink-0 rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    {wins} W
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
