import fs from 'fs';
import path from 'path';
import { normalizeThemeId } from '@/lib/themes';
import type { GlobalSettings } from '@/types/game';

const settingsFile = path.join(process.cwd(), 'data', 'settings.json');

const DefaultSettings: GlobalSettings = {
  theme: 'desert',
  minPlayers: 4,
  maxPlayers: 8,
  questionsPerRound: 10,
};

function normalizeSettings(raw: Partial<GlobalSettings>): GlobalSettings {
  const minPlayers = Math.max(1, parseInt(String(raw.minPlayers)) || DefaultSettings.minPlayers);
  const maxPlayers = Math.max(
    minPlayers,
    parseInt(String(raw.maxPlayers)) || DefaultSettings.maxPlayers
  );
  const questionsPerRound =
    parseInt(String(raw.questionsPerRound)) || DefaultSettings.questionsPerRound;

  return {
    theme: normalizeThemeId(raw.theme ?? DefaultSettings.theme),
    minPlayers,
    maxPlayers,
    questionsPerRound,
  };
}

export function loadSettings(): GlobalSettings {
  if (fs.existsSync(settingsFile)) {
    try {
      const raw = JSON.parse(fs.readFileSync(settingsFile, 'utf8')) as Partial<GlobalSettings>;
      return normalizeSettings(raw);
    } catch {
      return { ...DefaultSettings };
    }
  }
  return { ...DefaultSettings };
}

export function saveSettings(settings: GlobalSettings): void {
  fs.writeFileSync(settingsFile, JSON.stringify(normalizeSettings(settings), null, 2));
}
