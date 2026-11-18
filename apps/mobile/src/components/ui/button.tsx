import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { fonts, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const SIZES: Record<ButtonSize, { px: number; py: number; fs: number }> = {
  sm: { px: spacing.md, py: 6, fs: 12 },
  md: { px: spacing.lg, py: spacing.sm, fs: 14 },
  lg: { px: spacing.xl, py: 10, fs: 16 },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  style,
  children,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const metrics = SIZES[size];

  const palette = (pressed: boolean) => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: pressed ? theme.surfaceRaised : theme.surface,
          borderColor: theme.border,
          color: theme.text,
        };
      case 'ghost':
        return {
          backgroundColor: pressed ? theme.surfaceRaised : 'transparent',
          borderColor: 'transparent',
          color: theme.textSecondary,
        };
      case 'danger':
        return {
          backgroundColor: pressed ? theme.danger[700] : theme.danger[600],
          borderColor: 'transparent',
          color: '#ffffff',
        };
      default:
        return {
          backgroundColor: pressed ? theme.primary[700] : theme.primary[600],
          borderColor: 'transparent',
          color: '#ffffff',
        };
    }
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          paddingVertical: metrics.py,
          paddingHorizontal: metrics.px,
          opacity: isDisabled ? 0.5 : 1,
          backgroundColor: palette(pressed).backgroundColor,
          borderColor: palette(pressed).borderColor,
        },
        style,
      ]}
      {...rest}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={palette(false).color}
          style={styles.spinner}
        />
      )}
      <Text
        style={{
          color: palette(false).color,
          fontSize: metrics.fs,
          fontFamily: fonts.semibold,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
  },
  spinner: {
    marginRight: 2,
  },
});
