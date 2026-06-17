'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Crown, DoorOpen, Loader2, Play, Timer, Users } from 'lucide-react';
import { ThemedShell } from '@/components/layout/ThemedShell';
import { QuizPanel } from '@/components/game/QuizPanel';
import { RaceTrack } from '@/components/game/RaceTrack';
import { WinScreen } from '@/components/game/WinScreen';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useGameSocket, type GamePhase } from '@/hooks/useGameSocket';
import { loadJoinSession } from '@/lib/join-session';
import { NormalizePlayerName } from '@/lib/room-join';

interface GameViewProps {
  roomSlug: string;
}

type NameFieldError = 'empty' | 'taken' | 'same' | null;

const PhaseKeys: Record<GamePhase, string> = {
  connecting: 'phaseConnecting',
  waiting: 'phaseWaiting',
  countdown: 'phaseCountdown',
  playing: 'phasePlaying',
  finished: 'phaseFinished',
};

export function GameView({ roomSlug }: GameViewProps) {
  const t = useTranslations('game');
  const tCommon = useTranslations('common');
  const tToast = useTranslations('toast');
  const { state, leave, startCountdown, submitAnswer, rejoinWithName } = useGameSocket(roomSlug);
  const [replacementName, setReplacementName] = useState('');
  const [nameError, setNameError] = useState<NameFieldError>(null);
  const playerCount = state.lobbyPlayers.length || Object.keys(state.players).length;
  const minPct = Math.min(100, (playerCount / state.minPlayers) * 100);
  const remainingSlots = state.maxPlayers - playerCount;
  const isLobbyFull = playerCount >= state.maxPlayers;

  useEffect(() => {
    if (!state.nameConflict) return;
    setReplacementName('');
    setNameError(null);
  }, [state.nameConflict]);

  const nameErrorMessage =
    nameError === 'empty'
      ? tToast('fillName')
      : nameError === 'taken'
        ? tToast('nameTaken')
        : nameError === 'same'
          ? t('nameConflictSameName')
          : null;

  const handleNameConflictJoin = () => {
    const trimmed = replacementName.trim();
    const session = loadJoinSession();
    if (!trimmed) {
      setNameError('empty');
      return;
    }
    if (session && NormalizePlayerName(trimmed) === NormalizePlayerName(session.playerName)) {
      setNameError('same');
      return;
    }
    const taken = state.lobbyPlayers.some(
      (player) => NormalizePlayerName(player.name) === NormalizePlayerName(trimmed)
    );
    if (taken) {
      setNameError('taken');
      return;
    }
    if (!rejoinWithName(trimmed)) {
      setNameError('empty');
    }
  };

  return (
    <ThemedShell
      maxWidth="md"
      title={state.roomTitle || t('room')}
      subtitle={t('liveSession')}
      badges={
        <>
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3.5 w-3.5 text-primary" />
            {t('racers', { count: playerCount })}
          </Badge>
          <Badge variant="outline">{t(PhaseKeys[state.phase])}</Badge>
        </>
      }
      actions={
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outlineleave" size="sm" className="gap-1">
              <DoorOpen className="h-4 w-4" />
              {tCommon('leave')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent variant="borderless">
            <AlertDialogHeader>
              <AlertDialogTitle>{t('leaveRoomTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{t('leaveRoomDescription')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
              <AlertDialogAction variant="destructiveleavedialog" onClick={leave}>
                {tCommon('leave')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      }
    >
      {state.phase === 'connecting' && (
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('connecting')}
        </div>
      )}

      {(state.phase === 'waiting' || state.phase === 'countdown') && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>{t('waitingRoom')}</CardTitle>
            <CardDescription>
              {state.phase === 'countdown'
                ? t('raceStartsSoon')
                : state.isCreator
                  ? state.hasCompletedRound
                    ? t('hostStartNext')
                    : t('hostStartFirst')
                  : state.hasCompletedRound
                    ? t('guestWaitNext')
                    : t('guestWaitFirst')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="grid gap-2 sm:grid-cols-2">
              {state.lobbyPlayers.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-md border border-transparent bg-muted px-3 py-2 text-sm"
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ background: p.color }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-medium">{p.name}</span>
                  {p.id === state.creatorId && (
                    <Crown className="ml-auto h-4 w-4 text-primary" />
                  )}
                </li>
              ))}
            </ul>

            {state.isCreator && !state.countdownStarted && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>
                    {t('playerProgress', {
                      current: playerCount,
                      min: state.minPlayers,
                      max: state.maxPlayers,
                    })}
                  </span>
                </div>
                <Progress value={minPct} />
                {isLobbyFull ? (
                  <Button className="theme-cta gap-2" onClick={startCountdown}>
                    <Play className="h-4 w-4" />
                    {t('startRace')}
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="theme-cta gap-2">
                        <Play className="h-4 w-4" />
                        {t('startRace')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent variant="borderless">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('startRaceTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('startRaceConfirm')}{' '}
                          {playerCount < state.minPlayers && (
                            <>
                              {t('belowMinimum', {
                                count: playerCount,
                                min: state.minPlayers,
                              })}{' '}
                            </>
                          )}
                          {remainingSlots === 1
                            ? t('oneSlotLeft')
                            : t('slotsLeft', { count: remainingSlots })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                        <AlertDialogAction className="theme-cta" onClick={startCountdown}>
                          {t('startRace')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}

            {state.phase === 'countdown' && (
              <div className="flex flex-col items-center gap-2 py-4">
                <Timer className="h-6 w-6 text-primary" />
                <span className="text-5xl font-semibold tabular-nums">{state.countdown}</span>
                <p className="text-sm text-muted-foreground">{t('secondsUntilStart')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {state.phase === 'playing' && (
        <div className="space-y-6">
          <QuizPanel
            question={state.question}
            locked={state.questionLocked}
            selectedAnswer={state.selectedAnswer}
            showAnswerFeedback={state.showAnswerFeedback}
            error={state.error}
            onAnswer={submitAnswer}
          />
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">{t('race')}</CardTitle>
            </CardHeader>
            <CardContent>
              <RaceTrack players={state.players} />
            </CardContent>
          </Card>
        </div>
      )}

      {state.phase === 'finished' && state.winnerName && (
        <WinScreen
          winnerName={state.winnerName}
          players={state.players}
          autoStartDelaySeconds={state.autoStartDelaySeconds}
        />
      )}

      <AlertDialog open={state.nameConflict}>
        <AlertDialogContent variant="borderless">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('nameConflictTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('nameConflictDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <Field data-invalid={nameError ? true : undefined}>
            <FieldLabel htmlFor="name-conflict-input">{tCommon('name')}</FieldLabel>
            <Input
              id="name-conflict-input"
              placeholder={tCommon('namePlaceholder')}
              maxLength={15}
              value={replacementName}
              aria-invalid={nameError ? true : undefined}
              onChange={(e) => {
                setReplacementName(e.target.value);
                setNameError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameConflictJoin();
              }}
            />
            {nameErrorMessage && <FieldDescription>{nameErrorMessage}</FieldDescription>}
          </Field>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={leave}>{t('nameConflictGoHome')}</AlertDialogCancel>
            <AlertDialogAction className="theme-cta" onClick={handleNameConflictJoin}>
              {tCommon('join')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ThemedShell>
  );
}
