import { Platform, TextStyle, ViewStyle } from "react-native";

const baseFontFamily = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: "System",
});

export const APP_FONT_FAMILY = {
  regular: baseFontFamily,
  medium: baseFontFamily,
  semibold: baseFontFamily,
  bold: baseFontFamily,
} as const;

export const APP_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 28,
} as const;

export const APP_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const APP_MOTION = {
  fast: 160,
  normal: 240,
  slow: 360,
  spring: {
    damping: 18,
    stiffness: 210,
    mass: 1,
  },
} as const;

export const APP_SHADOWS = {
  none: {} as ViewStyle,
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  } as ViewStyle,
  floating: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  } as ViewStyle,
} as const;

export const getAppColors = (isDark: boolean) => ({
  background: isDark ? "#0B0E14" : "#F8FAFC",
  surface: isDark ? "#121721" : "#FFFFFF",
  elevated: isDark ? "#1B2331" : "#FFFFFF",
  text: isDark ? "#F8FAFC" : "#0F172A",
  subText: isDark ? "#94A3B8" : "#64748B",
  border: isDark ? "#1F2937" : "#E2E8F0",
  primary: "#3B66F5",
  badge: "#316AFF",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#EF4444",
  overlay: "rgba(0,0,0,0.6)",
  inputBg: isDark ? "#1E2530" : "#F9FAFB",
  buttonDisabled: isDark ? "#2D3748" : "#A5B4FC",
  whatsapp: "#25D366",
  link: "#3B66F5",
});

export const APP_TYPOGRAPHY = {
  family: APP_FONT_FAMILY,
  weight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  } as const,
  size: {
    xs: 12,
    sm: 13,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    title: 28,
  } as const,
} as const;

export const APP_TEXT_STYLES = {
  body: {
    fontFamily: APP_FONT_FAMILY.regular,
    fontSize: APP_TYPOGRAPHY.size.md,
    lineHeight: 20,
    fontWeight: APP_TYPOGRAPHY.weight.regular,
  } as TextStyle,
  bodyMedium: {
    fontFamily: APP_FONT_FAMILY.medium,
    fontSize: APP_TYPOGRAPHY.size.md,
    lineHeight: 20,
    fontWeight: APP_TYPOGRAPHY.weight.medium,
  } as TextStyle,
  caption: {
    fontFamily: APP_FONT_FAMILY.regular,
    fontSize: APP_TYPOGRAPHY.size.sm,
    lineHeight: 18,
    fontWeight: APP_TYPOGRAPHY.weight.regular,
  } as TextStyle,
  title: {
    fontFamily: APP_FONT_FAMILY.bold,
    fontSize: APP_TYPOGRAPHY.size.xl,
    lineHeight: 26,
    fontWeight: APP_TYPOGRAPHY.weight.bold,
  } as TextStyle,
  headline: {
    fontFamily: APP_FONT_FAMILY.bold,
    fontSize: APP_TYPOGRAPHY.size.title,
    lineHeight: 34,
    fontWeight: APP_TYPOGRAPHY.weight.bold,
  } as TextStyle,
} as const;

export const getScreenTheme = (isDark: boolean) => {
  const colors = getAppColors(isDark);
  return {
    bg: colors.background,
    card: colors.surface,
    cardBg: colors.surface,
    text: colors.text,
    subText: colors.subText,
    border: colors.border,
    primary: colors.primary,
    badge: colors.badge,
    inputBg: colors.inputBg,
    overlay: colors.overlay,
    placeholder: colors.subText,
    header: colors.surface,
    textPrimary: colors.text,
    textSecondary: colors.subText,
    textTertiary: isDark ? "#7C8DA5" : "#94A3B8",
    danger: colors.danger,
    iconBlue: colors.primary,
    pillBg: colors.elevated,
    titleText: isDark ? "#E2E8F0" : "#4B5563",
    valueText: isDark ? "#CBD5E1" : "#64748B",
    buttonDisabled: colors.buttonDisabled,
    whatsapp: colors.whatsapp,
    isDark,
  };
};

export type AppColors = ReturnType<typeof getAppColors>;
export type ScreenTheme = ReturnType<typeof getScreenTheme>;
export type AppThemeTokens = {
  isDark: boolean;
  colors: AppColors;
  typography: typeof APP_TYPOGRAPHY;
  textStyles: typeof APP_TEXT_STYLES;
  spacing: typeof APP_SPACING;
  radius: typeof APP_RADIUS;
  motion: typeof APP_MOTION;
  shadows: typeof APP_SHADOWS;
};

export const createAppTheme = (isDark: boolean): AppThemeTokens => ({
  isDark,
  colors: getAppColors(isDark),
  typography: APP_TYPOGRAPHY,
  textStyles: APP_TEXT_STYLES,
  spacing: APP_SPACING,
  radius: APP_RADIUS,
  motion: APP_MOTION,
  shadows: APP_SHADOWS,
});
