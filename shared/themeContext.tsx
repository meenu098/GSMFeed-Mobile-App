import React, { createContext, useContext, useMemo, useState } from "react";
import { Appearance } from "react-native";
import {
  createAppTheme,
  getScreenTheme,
  type AppColors,
  type AppThemeTokens,
  type ScreenTheme,
} from "./designSystem";

type ThemeContextValue = {
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: "dark" | "light") => void;
  theme: AppThemeTokens;
  colors: AppColors;
  screenTheme: ScreenTheme;
  typography: AppThemeTokens["typography"];
  textStyles: AppThemeTokens["textStyles"];
  spacing: AppThemeTokens["spacing"];
  radius: AppThemeTokens["radius"];
  motion: AppThemeTokens["motion"];
  shadows: AppThemeTokens["shadows"];
};

const defaultTheme = createAppTheme(false);

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggleTheme: () => {},
  setThemeMode: () => {},
  theme: defaultTheme,
  colors: defaultTheme.colors,
  screenTheme: getScreenTheme(false),
  typography: defaultTheme.typography,
  textStyles: defaultTheme.textStyles,
  spacing: defaultTheme.spacing,
  radius: defaultTheme.radius,
  motion: defaultTheme.motion,
  shadows: defaultTheme.shadows,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(Appearance.getColorScheme() === "dark");

  const toggleTheme = () => setIsDark((prev) => !prev);
  const setThemeMode = (mode: "dark" | "light") => setIsDark(mode === "dark");

  const theme = useMemo(() => createAppTheme(isDark), [isDark]);
  const screenTheme = useMemo(() => getScreenTheme(isDark), [isDark]);

  const value = useMemo(
    () => ({
      isDark,
      toggleTheme,
      setThemeMode,
      theme,
      colors: theme.colors,
      screenTheme,
      typography: theme.typography,
      textStyles: theme.textStyles,
      spacing: theme.spacing,
      radius: theme.radius,
      motion: theme.motion,
      shadows: theme.shadows,
    }),
    [isDark, theme, screenTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
