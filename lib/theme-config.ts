import type { ThemeId } from '@/lib/themes';

export interface ThemeConfig {
  id: ThemeId;
  label: string;
  backgroundImage: string;
  heroTitle: string;
  heroSubtitle: string;
}

export const THEME_CONFIG: Record<ThemeId, ThemeConfig> = {
  desert: {
    id: 'desert',
    label: 'Woestijn',
    backgroundImage: '/backgrounds/desert.svg',
    heroTitle: 'SUMMA KAMELENRACE',
    heroSubtitle: 'Race door de woestijn naar de finish',
  },
  jungle: {
    id: 'jungle',
    label: 'Jungle',
    backgroundImage: '/backgrounds/jungle.svg',
    heroTitle: 'SUMMA KAMELENRACE',
    heroSubtitle: 'Avontuur door de jungle',
  },
  ocean: {
    id: 'ocean',
    label: 'Oceaan',
    backgroundImage: '/backgrounds/ocean.svg',
    heroTitle: 'SUMMA KAMELENRACE',
    heroSubtitle: 'Duik in de quiz-race',
  },
  grassland: {
    id: 'grassland',
    label: 'Grasland',
    backgroundImage: '/backgrounds/grassland.svg',
    heroTitle: 'SUMMA KAMELENRACE',
    heroSubtitle: 'Race over de savanne',
  },
};

export function getThemeConfig(theme: ThemeId): ThemeConfig {
  return THEME_CONFIG[theme];
}
