import fs from 'fs';
import path from 'path';
import { normalizeThemeId } from '@/lib/themes';
import type { GlobalSettings } from '@/types/game';

const settingsFile = path.join(process.cwd(), 'data', 'settings.json');

const DEFAULT_SETTINGS: GlobalSettings = {
  theme: 'desert',
  minPlayers: 4,
  maxPlayers: 8,
  questionsPerRound: 10,
};

function normalizeSettings(raw: Partial<GlobalSettings>): GlobalSettings {
  const minPlayers = Math.max(1, parseInt(String(raw.minPlayers)) || DEFAULT_SETTINGS.minPlayers);
  const maxPlayers = Math.max(
    minPlayers,
    parseInt(String(raw.maxPlayers)) || DEFAULT_SETTINGS.maxPlayers
  );
  const questionsPerRound =
    parseInt(String(raw.questionsPerRound)) || DEFAULT_SETTINGS.questionsPerRound;

  return {
    theme: normalizeThemeId(raw.theme ?? DEFAULT_SETTINGS.theme),
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
      return { ...DEFAULT_SETTINGS };
    }
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: GlobalSettings): void {
  fs.writeFileSync(settingsFile, JSON.stringify(normalizeSettings(settings), null, 2));
}
