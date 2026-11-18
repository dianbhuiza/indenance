import React, { forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { fonts, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  name?: string;
  prefix?: string;
  suffix?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    hint,
    prefix,
    suffix,
    style,
    containerStyle,
    inputStyle,
    ...rest
  },
  ref,
) {
  const theme = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}

      <View
        style={[
          styles.control,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger[500] : theme.border,
          },
        ]}
      >
        {prefix && (
          <Text style={[styles.affix, { color: theme.textMuted }]}>{prefix}</Text>
        )}
        <TextInput
          ref={ref}
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { color: theme.text }, style, inputStyle]}
          {...rest}
        />
        {suffix && (
          <Text style={[styles.affix, { color: theme.textMuted }]}>{suffix}</Text>
        )}
      </View>

      {error ? (
        <Text style={[styles.message, { color: theme.danger[600] }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.message, { color: theme.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs + 2,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  affix: {
    fontSize: 15,
    fontFamily: fonts.medium,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    fontFamily: fonts.regular,
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.regular,
  },
});
