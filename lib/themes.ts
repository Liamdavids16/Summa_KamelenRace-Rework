export const THEMES = ['desert', 'jungle', 'ocean', 'grassland'] as const;

export type ThemeId = (typeof THEMES)[number];

export const THEME_LABELS: Record<ThemeId, string> = {
  desert: 'Woestijn',
  jungle: 'Jungle',
  ocean: 'Oceaan',
  grassland: 'Grasland',
};

const LEGACY_THEME_MAP: Record<string, ThemeId> = {
  slate: 'desert',
  ember: 'desert',
  forest: 'jungle',
  midnight: 'grassland',
  ocean: 'ocean',
  desert: 'desert',
  jungle: 'jungle',
  grassland: 'grassland',
};

export function normalizeThemeId(value: string): ThemeId {
  if (THEMES.includes(value as ThemeId)) return value as ThemeId;
  return LEGACY_THEME_MAP[value] ?? 'desert';
}

export function isThemeId(value: string): value is ThemeId {
  return THEMES.includes(value as ThemeId);
}
