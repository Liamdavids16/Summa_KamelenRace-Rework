import { normalizeThemeId } from '@/lib/themes';

export function applyTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', normalizeThemeId(theme));
}
