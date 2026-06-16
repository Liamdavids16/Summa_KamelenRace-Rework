'use client';

import { Crown, DoorOpen, Loader2, Play, Timer, Users } from 'lucide-react';
import { ThemedShell } from '@/components/layout/ThemedShell';
import { QuizPanel } from '@/components/game/QuizPanel';
import { RaceTrack } from '@/components/game/RaceTrack';
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
import { Progress } from '@/components/ui/progress';
import { useGameSocket } from '@/hooks/useGameSocket';

interface GameViewProps {
  roomSlug: string;
}

export function GameView({ roomSlug }: GameViewProps) {
  const { state, leave, startCountdown, submitAnswer } = useGameSocket(roomSlug);
  const playerCount = state.lobbyPlayers.length || Object.keys(state.players).length;
  const minPct = Math.min(100, (playerCount / state.minPlayers) * 100);
  const remainingSlots = state.maxPlayers - playerCount;
  const isLobbyFull = playerCount >= state.maxPlayers;

  return (
    <ThemedShell
      maxWidth="md"
      title={state.roomTitle || 'Kamer'}
      subtitle="Live sessie"
      badges={
        <>
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3.5 w-3.5 text-primary" />
            {playerCount} racers
          </Badge>
          <Badge variant="outline">{state.phase}</Badge>
        </>
      }
      actions={
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outlineleave" size="sm" className="gap-1">
              <DoorOpen className="h-4 w-4" />
              Verlaat
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent variant="borderless">
            <AlertDialogHeader>
              <AlertDialogTitle>Kamer verlaten?</AlertDialogTitle>
              <AlertDialogDescription>
                Weet je zeker dat je de kamer wilt verlaten? Je wordt teruggebracht naar
                de lobby.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuleren</AlertDialogCancel>
              <AlertDialogAction variant="destructiveleavedialog" onClick={leave}>
                Verlaat
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      }
    >
      {state.phase === 'connecting' && (
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verbinden met kamer...
        </div>
      )}

      {(state.phase === 'waiting' || state.phase === 'countdown') && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Wachtkamer</CardTitle>
            <CardDescription>
              {state.isCreator
                ? 'Jij bent de host. Start zodra iedereen er is.'
                : 'Wacht tot de host de race start.'}
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
                    {playerCount} / {state.minPlayers} spelers (max {state.maxPlayers})
                  </span>
                </div>
                <Progress value={minPct} />
                {isLobbyFull ? (
                  <Button
                    className="theme-cta gap-2"
                    onClick={startCountdown}
                  >
                    <Play className="h-4 w-4" />
                    Start race
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="theme-cta gap-2">
                        <Play className="h-4 w-4" />
                        Start race
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent variant="borderless">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Race starten?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Weet je zeker dat je wilt starten?{' '}
                          {playerCount < state.minPlayers && (
                            <>
                              Er {playerCount === 1 ? 'is' : 'zijn'} nu {playerCount}{' '}
                              {playerCount === 1 ? 'speler' : 'spelers'} (aanbevolen minimum:{' '}
                              {state.minPlayers}).{' '}
                            </>
                          )}
                          {remainingSlots === 1
                            ? 'Er kan nog 1 persoon joinen.'
                            : `Er kunnen nog ${remainingSlots} mensen joinen.`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuleren</AlertDialogCancel>
                        <AlertDialogAction className="theme-cta" onClick={startCountdown}>
                          Start race
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
                <p className="text-sm text-muted-foreground">seconden tot start</p>
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
              <CardTitle className="text-base">Race</CardTitle>
            </CardHeader>
            <CardContent>
              <RaceTrack players={state.players} />
            </CardContent>
          </Card>
        </div>
      )}

      {state.phase === 'finished' && state.winnerName && (
        <Card className="glass-card border-primary/40">
          <CardHeader>
            <CardTitle>Winnaar: {state.winnerName}</CardTitle>
            <CardDescription>De wachtkamer wordt zo herladen...</CardDescription>
          </CardHeader>
        </Card>
      )}
    </ThemedShell>
  );
}
