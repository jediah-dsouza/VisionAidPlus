import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import {
  colors as baseColors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  touchTarget,
} from '@shared/theme';
import { useAppSelector } from '../store';

type Colors = typeof baseColors;

interface Theme {
  colors: Colors;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  touchTarget: typeof touchTarget;
  isDark: boolean;
}

const ThemeContext = createContext<Theme | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const prefs = useAppSelector(state => state.settings.preferences);

  const theme = useMemo<Theme>(() => {
    const isDark = prefs.theme.highContrastMode || prefs.theme.themeMode === 'dark' || (prefs.theme.themeMode === 'system' && systemColorScheme === 'dark');

    return {
      colors: isDark ? baseColors : baseColors,
      spacing,
      borderRadius,
      fontSize,
      fontWeight,
      touchTarget,
      isDark,
    };
  }, [systemColorScheme, prefs.theme.highContrastMode, prefs.theme.themeMode]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
