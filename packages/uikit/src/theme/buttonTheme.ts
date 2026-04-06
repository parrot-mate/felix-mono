// theme/buttonTheme.ts
import type { ThemeType } from '../store/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'plain' | 'step';

export const buttonThemeClassMap: Record<ThemeType, Record<ButtonVariant, string>> = {
  light: {
    primary: 'bg-violet-500 text-white',
    secondary: 'bg-violet-300 text-white',
    accent: 'bg-rose-400 text-white',
    plain: 'bg-white text-violet-500',
    step: 'bg-indigo-900 text-white',
  },
  dark: {
    primary: 'bg-violet-300 text-black',
    secondary: 'bg-violet-800 text-white',
    accent: 'bg-rose-200 text-black',
    plain: 'bg-gray-700 text-white',
    step: 'bg-indigo-900 text-white',
  },
};
