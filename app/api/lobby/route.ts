import { NextResponse } from 'next/server';
import { refreshQuestionBank } from '@/lib/questions';
import { getSafeRooms } from '@/lib/socket/game-logic';
import { getLeaderboard, globalSettings } from '@/lib/socket/state';
import { normalizeThemeId } from '@/lib/themes';
import type { LobbyResponse } from '@/types/api';

export async function GET() {
  const bank = refreshQuestionBank();
  const body: LobbyResponse = {
    rooms: getSafeRooms(),
    categories: Object.keys(bank),
    leaderboard: getLeaderboard(),
    settings: {
      theme: normalizeThemeId(globalSettings.theme),
      minPlayers: globalSettings.minPlayers,
      maxPlayers: globalSettings.maxPlayers,
      questionsPerRound: globalSettings.questionsPerRound,
    },
  };
  return NextResponse.json(body);
}
