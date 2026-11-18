import { Platform, type ViewStyle } from 'react-native';

export type Scheme = 'light' | 'dark';

export type Ramp = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950?: string;
};

const primary: Ramp = {
  50: '#f0fdfa',
  100: '#ccfbf1',
  200: '#99f6e4',
  300: '#5eead4',
  400: '#2dd4bf',
  500: '#14b8a6',
  600: '#0d9488',
  700: '#0f766e',
  800: '#115e59',
  900: '#134e4a',
  950: '#042f2e',
};

const accent: Ramp = {
  50: '#fff7ed',
  100: '#ffedd5',
  200: '#fed7aa',
  300: '#fdba74',
  400: '#fb923c',
  500: '#f97316',
  600: '#ea580c',
  700: '#c2410c',
  800: '#9a3412',
  900: '#7c2d12',
};

const success: Ramp = {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#6ee7b7',
  400: '#34d399',
  500: '#10b981',
  600: '#059669',
  700: '#047857',
  800: '#065f46',
  900: '#064e3b',
};

const danger: Ramp = {
  50: '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444',
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
};

const warning: Ramp = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
};

const info: Ramp = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
};

const violet: Ramp = {
  50: '#f5f3ff',
  100: '#ede9fe',
  200: '#ddd6fe',
  300: '#c4b5fd',
  400: '#a78bfa',
  500: '#8b5cf6',
  600: '#7c3aed',
  700: '#6d28d9',
  800: '#5b21b6',
  900: '#4c1d95',
};

const neutral: Ramp = {
  50: '#fafaf9',
  100: '#f5f5f4',
  200: '#e7e5e4',
  300: '#d6d3d1',
  400: '#a8a29e',
  500: '#78716c',
  600: '#57534e',
  700: '#44403c',
  800: '#292524',
  900: '#1c1917',
  950: '#0c0a09',
};

export const ramps = { primary, accent, success, danger, warning, info, violet, neutral };

export type Theme = {
  scheme: Scheme;
  bg: string;
  surface: string;
  surfaceRaised: string;
  surfaceOverlay: string;
  border: string;
  borderSubtle: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: Ramp;
  accent: Ramp;
  success: Ramp;
  danger: Ramp;
  warning: Ramp;
  info: Ramp;
  violet: Ramp;
  neutral: Ramp;
};

export const lightTheme: Theme = {
  scheme: 'light',
  bg: '#faf9f7',
  surface: '#ffffff',
  surfaceRaised: '#f5f5f4',
  surfaceOverlay: 'rgba(255,255,255,0.8)',
  border: '#e7e5e4',
  borderSubtle: '#f5f5f4',
  text: '#1c1917',
  textSecondary: '#57534e',
  textMuted: '#a8a29e',
  ...ramps,
};

export const darkTheme: Theme = {
  scheme: 'dark',
  bg: '#0f0e0d',
  surface: '#1c1917',
  surfaceRaised: '#292524',
  surfaceOverlay: 'rgba(28,25,23,0.85)',
  border: '#292524',
  borderSubtle: '#1c1917',
  text: '#fafaf9',
  textSecondary: '#a8a29e',
  textMuted: '#78716c',
  ...ramps,
};

export const fonts = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
  display: 'DMSerifDisplay_400Regular',
};

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

const iosShadow = (
  y: number,
  blur: number,
  spread: number,
  opacity: number,
): ViewStyle => ({
  shadowColor: '#1c1917',
  shadowOffset: { width: 0, height: y },
  shadowOpacity: opacity,
  shadowRadius: blur,
});

export const shadow = {
  xs: Platform.select<ViewStyle>({
    ios: iosShadow(1, 2, 0, 0.04),
    android: { elevation: 1 },
    default: iosShadow(1, 2, 0, 0.04),
  })!,
  sm: Platform.select<ViewStyle>({
    ios: { ...iosShadow(1, 3, 0, 0.06), shadowOffset: { width: 0, height: 1 } },
    android: { elevation: 2 },
    default: iosShadow(1, 3, 0, 0.06),
  })!,
  md: Platform.select<ViewStyle>({
    ios: iosShadow(4, 6, -1, 0.07),
    android: { elevation: 4 },
    default: iosShadow(4, 6, -1, 0.07),
  })!,
  lg: Platform.select<ViewStyle>({
    ios: iosShadow(10, 15, -3, 0.08),
    android: { elevation: 8 },
    default: iosShadow(10, 15, -3, 0.08),
  })!,
  xl: Platform.select<ViewStyle>({
    ios: iosShadow(20, 25, -5, 0.1),
    android: { elevation: 12 },
    default: iosShadow(20, 25, -5, 0.1),
  })!,
};
