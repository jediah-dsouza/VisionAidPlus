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
  const settings = useAppSelector(state => state.settings);

  const theme = useMemo<Theme>(() => {
    const isDark = settings.highContrastMode || systemColorScheme === 'dark';

    return {
      colors: isDark ? baseColors : baseColors,
      spacing,
      borderRadius,
      fontSize,
      fontWeight,
      touchTarget,
      isDark,
    };
  }, [systemColorScheme, settings.highContrastMode]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
