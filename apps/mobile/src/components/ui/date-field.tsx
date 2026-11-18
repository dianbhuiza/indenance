import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from './button';
import { fonts, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

export function DateField({
  label,
  hint,
  error,
  value,
  onValueChange,
}: {
  label?: string;
  hint?: string;
  error?: string;
  value: string;
  onValueChange: (value: string) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((prev) => !prev)}
        style={[
          styles.trigger,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger[500] : theme.border,
          },
        ]}
      >
        <Text
          style={[
            styles.value,
            { color: value ? theme.text : theme.textMuted },
          ]}
        >
          {value || 'Seleccionar fecha'}
        </Text>
        <Calendar size={16} color={theme.textMuted} />
      </Pressable>

      {error ? (
        <Text style={[styles.message, { color: theme.danger[600] }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.message, { color: theme.textMuted }]}>{hint}</Text>
      ) : null}

      {open && (
        <View style={styles.picker}>
          <DateTimePicker
            value={value ? parseDate(value) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(_event, date) => {
              if (Platform.OS === 'android') {
                setOpen(false);
              }
              if (date) onValueChange(formatDate(date));
            }}
          />
          {Platform.OS === 'ios' && (
            <Button size="sm" onPress={() => setOpen(false)}>
              Listo
            </Button>
          )}
        </View>
      )}
    </View>
  );
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs + 2,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  value: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.regular,
  },
  picker: {
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e7e5e4',
    padding: spacing.sm,
    backgroundColor: '#ffffff',
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.regular,
  },
});
