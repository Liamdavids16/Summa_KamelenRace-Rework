export const Themes = ['desert', 'jungle', 'ocean', 'grassland'] as const;

export type ThemeId = (typeof Themes)[number];

export const ThemeLabels: Record<ThemeId, string> = {
  desert: 'Woestijn',
  jungle: 'Jungle',
  ocean: 'Oceaan',
  grassland: 'Grasland',
};

const LegacyThemeMap: Record<string, ThemeId> = {
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
  if (Themes.includes(value as ThemeId)) return value as ThemeId;
  return LegacyThemeMap[value] ?? 'desert';
}

export function isThemeId(value: string): value is ThemeId {
  return Themes.includes(value as ThemeId);
}
