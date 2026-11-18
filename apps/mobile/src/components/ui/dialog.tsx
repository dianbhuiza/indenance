import { X } from 'lucide-react-native';
import React, { type ComponentType } from 'react';
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

export type IconType = ComponentType<{
  size?: number | string;
  color?: string;
  strokeWidth?: number;
}>;

export function Dialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
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
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function DialogHeader({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
  onClose,
}: {
  icon: IconType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  onClose: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      <View style={[styles.iconTile, { backgroundColor: iconBg }]}>
        <Icon size={20} color={iconColor} strokeWidth={2.25} />
      </View>
      <View style={styles.headerText}>
        <Text
          style={[styles.title, { color: theme.text, fontFamily: fonts.bold }]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.description,
            { color: theme.textSecondary, fontFamily: fonts.regular },
          ]}
        >
          {description}
        </Text>
      </View>
      <Pressable hitSlop={10} onPress={onClose} style={styles.close}>
        <X size={18} color={theme.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
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
    paddingHorizontal: spacing.lg,
  },
  popup: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: '88%',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  close: {
    paddingTop: 2,
  },
});
