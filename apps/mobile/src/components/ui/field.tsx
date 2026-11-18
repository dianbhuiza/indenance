import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { fonts, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export function Field({
  label,
  error,
  hint,
  required,
  children,
  style,
}: {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.field, style]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
          {required && <Text style={styles.required}> *</Text>}
        </View>
      )}
      {children}
      {error ? (
        <Text style={[styles.message, { color: theme.danger[600] }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.message, { color: theme.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs + 2,
  },
  labelRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  required: {
    color: '#ef4444',
    fontSize: 14,
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.regular,
  },
});
