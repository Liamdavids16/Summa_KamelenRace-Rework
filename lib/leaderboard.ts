import fs from 'fs';
import path from 'path';
import type { Leaderboard } from '@/types/game';

const leaderboardFile = path.join(process.cwd(), 'data', 'leaderboard.json');

export function loadLeaderboard(): Leaderboard {
  if (fs.existsSync(leaderboardFile)) {
    try {
      return JSON.parse(fs.readFileSync(leaderboardFile, 'utf8')) as Leaderboard;
    } catch {
      return {};
    }
  }
  return {};
}

export function saveLeaderboard(leaderboard: Leaderboard): void {
  fs.writeFileSync(leaderboardFile, JSON.stringify(leaderboard, null, 2));
}
