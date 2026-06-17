'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronDown, Layers, Loader2, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ThemedShell } from '@/components/layout/ThemedShell';
import { LeaderboardSidebar } from '@/components/lobby/LeaderboardSidebar';
import { RoomCard } from '@/components/lobby/RoomCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLobbyData } from '@/hooks/useLobbyData';
import { useThemeOptions } from '@/hooks/useActiveTheme';
import { saveJoinSession } from '@/lib/join-session';
import { IsPlayerNameTakenInRoom } from '@/lib/room-join';
import { roomSettingsFromGlobal } from '@/lib/room-settings';
import { normalizeThemeId, type ThemeId } from '@/lib/themes';
import type { RoomSettings } from '@/types/game';

type PlayerNameFieldError = 'taken' | null;

export function LobbyView() {
  const router = useRouter();
  const t = useTranslations('lobby');
  const tCommon = useTranslations('common');
  const tToast = useTranslations('toast');
  const themeOptions = useThemeOptions();
  const { rooms, categories, leaderboard, settings, loading, error, refresh } = useLobbyData();
  const [playerName, setPlayerName] = useState('');
  const [playerNameError, setPlayerNameError] = useState<PlayerNameFieldError>(null);
  const [roomName, setRoomName] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('__new__');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [roomExists, setRoomExists] = useState(false);
  const [checkingRoom, setCheckingRoom] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [theme, setTheme] = useState<ThemeId>('desert');
  const [minPlayers, setMinPlayers] = useState(4);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [questionsPerRound, setQuestionsPerRound] = useState(10);
  const [countdownSeconds, setCountdownSeconds] = useState(10);
  const [autoKickAfterRound, setAutoKickAfterRound] = useState(false);
  const [autoStartDelaySeconds, setAutoStartDelaySeconds] = useState(10);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const roomNames = useMemo(() => Object.keys(rooms), [rooms]);

  useEffect(() => {
    const defaults = roomSettingsFromGlobal(settings);
    setTheme(normalizeThemeId(defaults.theme));
    setMinPlayers(defaults.minPlayers);
    setMaxPlayers(defaults.maxPlayers);
    setQuestionsPerRound(defaults.questionsPerRound);
    setCountdownSeconds(defaults.countdownSeconds);
    setAutoKickAfterRound(defaults.autoKickAfterRound);
    setAutoStartDelaySeconds(defaults.autoStartDelaySeconds);
  }, [settings]);

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

  const buildRoomSettings = (): RoomSettings => ({
    theme,
    minPlayers,
    maxPlayers,
    questionsPerRound,
    countdownSeconds,
    autoKickAfterRound,
    autoStartDelaySeconds,
  });

  const handleJoin = () => {
    const name = playerName.trim();
    const room = roomName.trim();
    if (!name || !room) {
      toast.error(tToast('fillNameAndRoom'));
      return;
    }

    const cats = roomExists ? [] : Array.from(selectedCategories);
    if (!roomExists && cats.length === 0) {
      toast.error(tToast('pickCategory'));
      return;
    }

    if (!roomExists && minPlayers > maxPlayers) {
      toast.error(tToast('minGreaterThanMax'));
      return;
    }

    if (roomExists && IsPlayerNameTakenInRoom(rooms[room], name, room)) {
      setPlayerNameError('taken');
      return;
    }

    setPlayerNameError(null);
    saveJoinSession({
      playerName: name,
      roomName: room,
      categories: cats,
      ...(!roomExists ? { settings: buildRoomSettings() } : {}),
    });
    router.push(`/room/${encodeURIComponent(room)}`);
  };

  const handleQuickJoin = (joinRoomName: string, joinPlayerName: string) => {
    saveJoinSession({
      playerName: joinPlayerName.trim(),
      roomName: joinRoomName,
      categories: [],
    });
    router.push(`/room/${encodeURIComponent(joinRoomName)}`);
  };

  return (
    <ThemedShell
      badges={
        <>
          <Badge variant="secondary" className="h-8 gap-1.5 rounded-full px-3 font-normal">
            <Users className="h-3.5 w-3.5 text-primary" />
            {t('roomCount', { count: roomNames.length })}
          </Badge>
          <Badge variant="secondary" className="h-8 gap-1.5 rounded-full px-3 font-normal">
            <Layers className="h-3.5 w-3.5 text-primary" />
            {t('categoryCount', { count: categories.length })}
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
          {tCommon('refresh')}
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
              <CardTitle className="text-xl">{t('startSession')}</CardTitle>
              <CardDescription>{t('startSessionDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2 sm:grid-cols-1">
                <Field data-invalid={playerNameError ? true : undefined}>
                  <FieldLabel htmlFor="playerName">{tCommon('name')}</FieldLabel>
                  <Input
                    id="playerName"
                    placeholder={tCommon('namePlaceholder')}
                    maxLength={15}
                    value={playerName}
                    aria-invalid={playerNameError ? true : undefined}
                    onChange={(e) => {
                      setPlayerName(e.target.value);
                      setPlayerNameError(null);
                    }}
                  />
                  {playerNameError === 'taken' && (
                    <FieldDescription>{tToast('nameTaken')}</FieldDescription>
                  )}
                </Field>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomName">{t('roomName')}</Label>
                <Input
                  id="roomName"
                  placeholder={t('roomNamePlaceholder')}
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
                    {t('checkingRoom')}
                  </p>
                )}
                {roomExists && !checkingRoom && (
                  <p className="text-xs text-muted-foreground">{t('existingRoom')}</p>
                )}
              </div>

              {!roomExists && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full justify-between px-4 font-medium"
                      onClick={() => setSettingsOpen((open) => !open)}
                      aria-expanded={settingsOpen}
                    >
                      <span>{t('sessionSettings')}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform ${settingsOpen ? '' : '-rotate-90'}`}
                      />
                    </Button>
                    {settingsOpen && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="sessionTheme" className="text-xs text-muted-foreground">
                            {tCommon('theme')}
                          </Label>
                          <Select value={theme} onValueChange={(v) => setTheme(v as ThemeId)}>
                            <SelectTrigger id="sessionTheme">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent variant="borderless">
                              {themeOptions.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="minPlayers" className="text-xs text-muted-foreground">
                              {tCommon('minPlayers')}
                            </Label>
                            <NumberInput
                              id="minPlayers"
                              min={1}
                              max={20}
                              value={minPlayers}
                              onChange={setMinPlayers}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="maxPlayers" className="text-xs text-muted-foreground">
                              {tCommon('maxPlayers')}
                            </Label>
                            <NumberInput
                              id="maxPlayers"
                              min={1}
                              max={20}
                              value={maxPlayers}
                              onChange={setMaxPlayers}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="questionsPerRound"
                              className="text-xs text-muted-foreground"
                            >
                              {tCommon('questionsPerRound')}
                            </Label>
                            <NumberInput
                              id="questionsPerRound"
                              min={1}
                              max={100}
                              value={questionsPerRound}
                              onChange={setQuestionsPerRound}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="countdownSeconds"
                              className="text-xs text-muted-foreground"
                            >
                              {t('countdownSeconds')}
                            </Label>
                            <NumberInput
                              id="countdownSeconds"
                              min={3}
                              max={60}
                              value={countdownSeconds}
                              onChange={setCountdownSeconds}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="autoStartDelaySeconds"
                              className="text-xs text-muted-foreground"
                            >
                              {t('autoRestartSeconds')}
                            </Label>
                            <NumberInput
                              id="autoStartDelaySeconds"
                              min={10}
                              max={60}
                              value={autoStartDelaySeconds}
                              onChange={setAutoStartDelaySeconds}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-4 rounded-md px-1 py-1">
                          <Label
                            htmlFor="autoKickAfterRound"
                            className="cursor-pointer text-sm leading-tight"
                          >
                            {t('autoKickAfterRound')}
                          </Label>
                          <Switch
                            id="autoKickAfterRound"
                            checked={autoKickAfterRound}
                            onCheckedChange={setAutoKickAfterRound}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label>{t('chooseCategories')}</Label>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setSelectedCategories(new Set(categories))}
                        >
                          {t('selectAll')}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setSelectedCategories(new Set())}
                        >
                          {t('selectNone')}
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
                      {t('selectedCount', {
                        selected: selectedCategories.size,
                        total: categories.length,
                      })}
                    </p>
                  </div>
                </>
              )}

              <Button
                className="theme-cta h-11 w-full gap-2 text-base sm:w-auto"
                onClick={handleJoin}
                disabled={loading || !playerName.trim() || !roomName.trim()}
              >
                {t('goToRoom')}
              </Button>
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="page-heading text-lg">{t('availableGames')}</h2>
            {loading ? (
              <div className="glass-panel flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {tCommon('loading')}
              </div>
            ) : roomNames.length === 0 ? (
              <div className="glass-panel px-4 py-8 text-sm text-muted-foreground">
                {t('noActiveRooms')}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {roomNames.map((name) => (
                  <RoomCard
                    key={name}
                    name={name}
                    room={rooms[name]}
                    initialPlayerName={playerName}
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
