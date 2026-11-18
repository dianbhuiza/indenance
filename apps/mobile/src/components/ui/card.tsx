import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { fonts, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'info';
}) {
  const theme = useTheme();

  const tones = {
    default: [theme.neutral[100], theme.neutral[700]],
    primary: [theme.primary[100], theme.primary[700]],
    success: [theme.success[100], theme.success[700]],
    danger: [theme.danger[100], theme.danger[700]],
    warning: [theme.warning[100], theme.warning[700]],
    info: [theme.info[100], theme.info[700]],
  } as const;

  const [bg, fg] = tones[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{children}</Text>
    </View>
  );
}

export function Spinner({
  size = 'large',
  color,
}: {
  size?: 'small' | 'large';
  color?: string;
}) {
  const theme = useTheme();
  return (
    <ActivityIndicator
      size={size}
      color={color ?? theme.primary[600]}
      style={styles.spinner}
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      {icon}
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      {description && (
        <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
          {description}
        </Text>
      )}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
  },
  spinner: {
    paddingVertical: spacing.xl,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
});
