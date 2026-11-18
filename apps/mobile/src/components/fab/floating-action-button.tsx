import {
  ArrowRightLeft,
  CalendarClock,
  HandCoins,
  PiggyBank,
  Plus,
  ShoppingCart,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import type { IconType } from '@/components/ui';
import { fonts, radius, shadow, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

interface FabAction {
  id: string;
  label: string;
  icon: IconType;
  color: string;
  background: string;
}

const ACTIONS: FabAction[] = [
  {
    id: 'transaction',
    label: 'Transacción',
    icon: ArrowRightLeft,
    color: '#0f766e',
    background: 'rgba(20,184,166,0.18)',
  },
  {
    id: 'loan',
    label: 'Préstamo',
    icon: HandCoins,
    color: '#1d4ed8',
    background: 'rgba(59,130,246,0.18)',
  },
  {
    id: 'shopping',
    label: 'Lista de compra',
    icon: ShoppingCart,
    color: '#c2410c',
    background: 'rgba(249,115,22,0.18)',
  },
  {
    id: 'budget',
    label: 'Presupuesto',
    icon: PiggyBank,
    color: '#6d28d9',
    background: 'rgba(139,92,246,0.18)',
  },
  {
    id: 'planned',
    label: 'Transacción planeada',
    icon: CalendarClock,
    color: '#b45309',
    background: 'rgba(245,158,11,0.18)',
  },
];

function FabActionItem({
  action,
  index,
  onPress,
}: {
  action: FabAction;
  index: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  const [progress] = useState(() => new Animated.Value(0));
  const Icon = action.icon;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      delay: index * 45,
      useNativeDriver: true,
    }).start();
  }, [index, progress]);

  return (
    <Animated.View
      style={[
        styles.actionRow,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.actionLabel,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text
          style={[styles.actionLabelText, { color: theme.text }]}
          numberOfLines={1}
        >
          {action.label}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action.label}
        onPress={onPress}
        style={({ pressed }) => [
          styles.actionButton,
          {
            backgroundColor: action.background,
            borderColor: theme.border,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          },
        ]}
      >
        <Icon size={20} color={action.color} strokeWidth={2.25} />
      </Pressable>
    </Animated.View>
  );
}

export function FloatingActionButton({
  onAction,
}: {
  onAction: (actionId: string) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleAction = (actionId: string) => {
    setOpen(false);
    onAction(actionId);
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {open && (
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessibilityLabel="Cerrar menú"
        />
      )}

      <View style={styles.stack} pointerEvents="box-none">
        {open &&
          ACTIONS.slice()
            .reverse()
            .map((action, index) => (
              <FabActionItem
                key={action.id}
                action={action}
                index={index}
                onPress={() => handleAction(action.id)}
              />
            ))}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={open ? 'Cerrar' : 'Crear'}
          onPress={() => setOpen((prev) => !prev)}
          style={({ pressed }) => [
            styles.fab,
            shadow.lg,
            {
              backgroundColor: open ? theme.danger[600] : theme.primary[600],
              transform: [{ scale: pressed ? 0.94 : 1 }],
            },
          ]}
        >
          <Plus
            size={26}
            color="#ffffff"
            strokeWidth={2.5}
            style={{
              transform: [{ rotate: open ? '45deg' : '0deg' }],
            }}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  stack: {
    alignItems: 'flex-end',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionLabel: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 200,
  },
  actionLabelText: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  actionButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
