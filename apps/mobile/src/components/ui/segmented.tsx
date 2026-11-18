import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';
import { Switch } from './switch';

export interface SegmentedOption<T extends string> {
  label: string;
  value: T;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  activeColor,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  activeColor?: string;
}) {
  const theme = useTheme();
  const accent = activeColor ?? theme.primary[600];

  return (
    <View style={[styles.segment, { backgroundColor: theme.surfaceRaised }]}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onValueChange(option.value)}
            style={[
              styles.segmentItem,
              {
                backgroundColor: isActive ? theme.surface : 'transparent',
                borderColor: isActive ? accent : 'transparent',
              },
            ]}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: isActive ? fonts.semibold : fonts.medium,
                color: isActive ? accent : theme.textSecondary,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchText}>
        <Text
          style={{
            fontSize: 14,
            fontFamily: fonts.medium,
            color: theme.text,
          }}
        >
          {label}
        </Text>
        {description && (
          <Text
            style={{
              fontSize: 12,
              lineHeight: 16,
              fontFamily: fonts.regular,
              color: theme.textMuted,
            }}
          >
            {description}
          </Text>
        )}
      </View>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.md,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md - 2,
    borderWidth: 1.5,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
});
