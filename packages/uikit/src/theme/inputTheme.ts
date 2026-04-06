// theme/inputTheme.ts
import type { ThemeType } from '../store/theme';

export type InputVariant = 'primary';

export const inputThemeClassMap: Record<ThemeType, Record<InputVariant, string>> = {
  light: {
    primary: 'bg-white text-grey90 placeholder-gray-400 focus:border-violet-500',
  },
  dark: {
    primary: 'bg-white text-grey90 placeholder-gray-400 focus:border-violet-500',
  },
};