import { NextResponse } from 'next/server';
import { getSafeRooms } from '@/lib/socket/game-logic';
import { globalSettings, rooms } from '@/lib/socket/state';
import type { RoomDetailResponse } from '@/types/api';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const exists = !!rooms[decoded];

  const body: RoomDetailResponse = {
    exists,
    maxPlayers: globalSettings.maxPlayers,
  };

  if (exists) {
    const safe = getSafeRooms()[decoded];
    body.status = safe.status;
    body.playerCount = safe.playerCount;
  }

  return NextResponse.json(body);
}
