import React, { createContext, useCallback, useEffect, useState } from 'react';
import type { PaletteMode } from '@mui/material';
import { ThemeProvider as MuiThemeProvider } from '@mui/material';

import packageJson from '../../package.json';
import { createTheme } from './createTheme';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const ToggleModeContext = createContext(() => {});

const localStorageLabel = `theme-${packageJson.name}`;

interface Props {
  children: React.ReactNode;
}
const defaultMode =
  (localStorage.getItem(localStorageLabel) as PaletteMode) ?? 'light';

const lightTheme = createTheme('light');
const darkTheme = createTheme('dark');

export function ThemeProvider({ children }: Props): JSX.Element {
  const [mode, setMode] = useState<PaletteMode>('light');

  const toggleMode = useCallback(() => {
    const newMode = mode === 'light' ? 'dark' : 'light';

    localStorage.setItem(localStorageLabel, newMode);
    setMode(newMode);
  }, [mode]);

  // needs for refreshing of static react snap files
  useEffect(() => {
    setMode(defaultMode);
  }, []);

  return (
    <MuiThemeProvider theme={mode === 'light' ? lightTheme : darkTheme}>
      <ToggleModeContext.Provider value={toggleMode}>
        {children}
      </ToggleModeContext.Provider>
    </MuiThemeProvider>
  );
}
