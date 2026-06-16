'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, Loader2, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ThemedShell } from '@/components/layout/ThemedShell';
import { LeaderboardSidebar } from '@/components/lobby/LeaderboardSidebar';
import { RoomCard } from '@/components/lobby/RoomCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLobbyData } from '@/hooks/useLobbyData';
import { saveJoinSession } from '@/lib/join-session';

export function LobbyView() {
  const router = useRouter();
  const { rooms, categories, leaderboard, settings, loading, error, refresh } = useLobbyData();
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('__new__');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [roomExists, setRoomExists] = useState(false);
  const [checkingRoom, setCheckingRoom] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const roomNames = useMemo(() => Object.keys(rooms), [rooms]);

  useEffect(() => {
    if (categories.length > 0) {
      setSelectedCategories((prev) => (prev.size === 0 ? new Set(categories) : prev));
    }
  }, [categories]);

  const checkRoom = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setRoomExists(false);
      return;
    }
    setCheckingRoom(true);
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      setRoomExists(data.exists);
    } finally {
      setCheckingRoom(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const toggleCategory = (cat: string, checked: boolean) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (checked) next.add(cat);
      else next.delete(cat);
      return next;
    });
  };

  const handleJoin = () => {
    const name = playerName.trim();
    const room = roomName.trim();
    if (!name || !room) {
      toast.error('Vul een naam en kamernaam in');
      return;
    }

    const cats = roomExists ? [] : Array.from(selectedCategories);
    if (!roomExists && cats.length === 0) {
      toast.error('Kies minimaal één categorie');
      return;
    }

    saveJoinSession({ playerName: name, roomName: room, categories: cats });
    router.push(`/room/${encodeURIComponent(room)}`);
  };

  const handleQuickJoin = (name: string) => {
    if (!playerName.trim()) {
      toast.error('Vul eerst je naam in');
      return;
    }
    saveJoinSession({ playerName: playerName.trim(), roomName: name, categories: [] });
    router.push(`/room/${encodeURIComponent(name)}`);
  };

  return (
    <ThemedShell
      badges={
        <>
          <Badge variant="secondary" className="h-8 gap-1.5 rounded-full px-3 font-normal">
            <Users className="h-3.5 w-3.5 text-primary" />
            {roomNames.length} kamers
          </Badge>
          <Badge variant="secondary" className="h-8 gap-1.5 rounded-full px-3 font-normal">
            <Layers className="h-3.5 w-3.5 text-primary" />
            {categories.length} categorieën
          </Badge>
        </>
      }
      actions={
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-full"
          disabled={refreshing}
          onClick={() => void handleRefresh()}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Vernieuwen
        </Button>
      }
    >
      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive backdrop-blur-sm">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,260px)_1fr]">
        <LeaderboardSidebar leaderboard={leaderboard} />

        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Start een sessie</CardTitle>
              <CardDescription>
                Nieuwe kamer aanmaken of deelnemen aan een lopende game.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2 sm:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="playerName">Naam</Label>
                  <Input
                    id="playerName"
                    placeholder="Jouw naam (bijv. HackerHenk)"
                    maxLength={15}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomName">Kamernaam</Label>
                <Input
                  id="roomName"
                  placeholder="Typ hier je nieuwe kamernaam..."
                  value={roomName}
                  onChange={(e) => {
                    setRoomName(e.target.value);
                    if (selectedRoom !== '__new__') setSelectedRoom('__new__');
                  }}
                  onBlur={(e) => void checkRoom(e.target.value)}
                />
                {checkingRoom && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Kamer controleren...
                  </p>
                )}
                {roomExists && !checkingRoom && (
                  <p className="text-xs text-muted-foreground">
                    Bestaande kamer — categorieën worden overgenomen.
                  </p>
                )}
              </div>

              {!roomExists && (
                <>
                    <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Kies Categorieën</Label>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setSelectedCategories(new Set(categories))}
                        >
                          Alles
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setSelectedCategories(new Set())}
                        >
                          Geen
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="glass-panel h-44 p-3">
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {categories.map((cat) => (
                          <label
                            key={cat}
                              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                          >
                            <Checkbox
                              checked={selectedCategories.has(cat)}
                              onCheckedChange={(checked) =>
                                toggleCategory(cat, checked === true)
                              }
                            />
                            <span className="leading-tight">{cat}</span>
                          </label>
                        ))}
                      </div>
                    </ScrollArea>
                    <p className="text-xs text-muted-foreground">
                      {selectedCategories.size} van {categories.length} geselecteerd
                    </p>
                  </div>
                </>
              )}

              <Button
                className="theme-cta h-11 w-full gap-2 text-base sm:w-auto"
                onClick={handleJoin}
                disabled={loading || !playerName.trim() || !roomName.trim()}
              >
                Ga naar kamer
              </Button>
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="page-heading text-lg">Beschikbare games</h2>
            {loading ? (
              <div className="glass-panel flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Laden...
              </div>
            ) : roomNames.length === 0 ? (
              <div className="glass-panel px-4 py-8 text-sm text-muted-foreground">
                Geen actieve kamers. Start de eerste sessie hierboven.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {roomNames.map((name) => (
                  <RoomCard
                    key={name}
                    name={name}
                    room={rooms[name]}
                    maxPlayers={settings.maxPlayers}
                    onJoin={handleQuickJoin}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </ThemedShell>
  );
}
