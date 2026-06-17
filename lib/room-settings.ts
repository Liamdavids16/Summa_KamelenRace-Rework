import { normalizeThemeId } from '@/lib/themes';
import type { GlobalSettings, RoomSettings } from '@/types/game';

const DefaultCountdownSeconds = 10;
const DefaultAutoStartDelaySeconds = 10;

export function roomSettingsFromGlobal(global: GlobalSettings): RoomSettings {
  return {
    theme: normalizeThemeId(global.theme),
    minPlayers: global.minPlayers,
    maxPlayers: global.maxPlayers,
    questionsPerRound: global.questionsPerRound,
    countdownSeconds: DefaultCountdownSeconds,
    autoKickAfterRound: false,
    autoStartDelaySeconds: DefaultAutoStartDelaySeconds,
  };
}

export function normalizeRoomSettings(raw: Partial<RoomSettings>, fallback: RoomSettings): RoomSettings {
  const minPlayers = Math.min(
    20,
    Math.max(1, parseInt(String(raw.minPlayers)) || fallback.minPlayers)
  );
  const maxPlayers = Math.min(
    20,
    Math.max(minPlayers, parseInt(String(raw.maxPlayers)) || fallback.maxPlayers)
  );
  const questionsPerRound = Math.min(
    100,
    Math.max(1, parseInt(String(raw.questionsPerRound)) || fallback.questionsPerRound)
  );
  const countdownSeconds = Math.min(
    60,
    Math.max(3, parseInt(String(raw.countdownSeconds)) || fallback.countdownSeconds)
  );
  const autoStartDelaySeconds = Math.min(
    60,
    Math.max(10, parseInt(String(raw.autoStartDelaySeconds)) || fallback.autoStartDelaySeconds)
  );

  return {
    theme: normalizeThemeId(raw.theme ?? fallback.theme),
    minPlayers,
    maxPlayers,
    questionsPerRound,
    countdownSeconds,
    autoKickAfterRound: raw.autoKickAfterRound ?? fallback.autoKickAfterRound,
    autoStartDelaySeconds,
  };
}
