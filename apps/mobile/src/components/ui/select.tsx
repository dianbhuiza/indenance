import { Check, ChevronDown, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { fonts, radius, shadow, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export type SelectOption = { label: string; value: string };

export interface SelectProps {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  value?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
}

export function Select({
  label,
  error,
  hint,
  placeholder = 'Selecciona una opción',
  value,
  onValueChange,
  options,
  disabled,
}: SelectProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger[500] : theme.border,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.triggerText,
            {
              color: selected ? theme.text : theme.textMuted,
              fontFamily: fonts.regular,
            },
          ]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown size={16} color={theme.textMuted} />
      </Pressable>

      {error ? (
        <Text style={[styles.message, { color: theme.danger[600] }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.message, { color: theme.textMuted }]}>{hint}</Text>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setOpen(false)}
            accessibilityLabel="Cerrar"
          />
          <View style={styles.center} pointerEvents="box-none">
            <View
              style={[
                styles.popup,
                shadow.xl,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View
                style={[styles.popupHeader, { borderBottomColor: theme.border }]}
              >
                <Text
                  style={[
                    styles.popupTitle,
                    { color: theme.text, fontFamily: fonts.semibold },
                  ]}
                >
                  {label ?? placeholder}
                </Text>
                <Pressable hitSlop={8} onPress={() => setOpen(false)}>
                  <X size={18} color={theme.textMuted} />
                </Pressable>
              </View>
              <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
              >
                {options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        onValueChange(option.value);
                        setOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.item,
                        {
                          backgroundColor: pressed
                            ? theme.surfaceRaised
                            : isSelected
                              ? theme.surfaceRaised
                              : 'transparent',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.itemText,
                          {
                            color: theme.text,
                            fontFamily: isSelected
                              ? fonts.semibold
                              : fonts.regular,
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {option.label}
                      </Text>
                      {isSelected && (
                        <Check size={16} color={theme.primary[600]} strokeWidth={2.5} />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
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
    minWidth: 148,
  },
  triggerText: {
    flexShrink: 1,
    fontSize: 15,
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.regular,
  },
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  popup: {
    maxHeight: '75%',
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  popupTitle: {
    fontSize: 15,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingVertical: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
  },
});
