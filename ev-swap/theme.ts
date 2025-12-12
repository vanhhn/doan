// Theme colors and styling constants for React Native
export const Colors = {
  light: {
    primary: "#006A6A",
    primaryLight: "#E0F2F1",
    primaryDark: "#004D40",
    secondary: "#4A6363",
    background: "#F8F9FA",
    surface: "#FFFFFF",
    surfaceVariant: "#E5E7EB",
    onSurface: "#1A1C1C",
    onSurfaceVariant: "#6B7280",
    text: "#1A1C1C",
    textSecondary: "#4A6363",
    border: "#E0E0E0",
    error: "#EF4444",
    success: "#10B981",
  },
  dark: {
    primary: "#4DDAD9",
    primaryLight: "#003737",
    primaryDark: "#B0F5F4",
    secondary: "#B1CCCB",
    background: "#1A1C1C",
    surface: "#252828",
    surfaceVariant: "#374151",
    onSurface: "#E2E3E2",
    onSurfaceVariant: "#9CA3AF",
    text: "#E2E3E2",
    textSecondary: "#B1CCCB",
    border: "#404040",
    error: "#EF4444",
    success: "#10B981",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 16, // alias for base
  lg: 18,
  xl: 20,
  xxl: 22,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
};

export const FontWeights = {
  regular: "400" as const,
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};
