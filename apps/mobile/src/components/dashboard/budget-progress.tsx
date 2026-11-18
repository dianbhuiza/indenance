import {
  computeBudgetProgress,
  formatNumber,
  getMonthLabel,
  useBudgetsQuery,
} from '@indenance/core';
import { Target } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Section } from '@/components/dashboard/section';
import { Button } from '@/components/ui';
import { fonts, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

const BAR_COLORS = ['#14b8a6', '#f97316', '#8b5cf6', '#f59e0b'];

export function BudgetProgress({
  onCreateBudget,
}: {
  onCreateBudget?: () => void;
}) {
  const theme = useTheme();
  const { data: budgets = [], isLoading } = useBudgetsQuery();

  if (isLoading) {
    return (
      <Section title="Presupuestos">
        <View style={styles.list}>
          {[0, 1].map((index) => (
            <View key={index} style={styles.skeleton}>
              <View style={styles.skeletonHeader}>
                <View
                  style={[
                    styles.skeletonBar,
                    { width: 96, backgroundColor: theme.surfaceRaised },
                  ]}
                />
                <View
                  style={[
                    styles.skeletonBar,
                    { width: 64, backgroundColor: theme.surfaceRaised },
                  ]}
                />
              </View>
              <View
                style={[
                  styles.track,
                  { backgroundColor: theme.surfaceRaised, height: 8 },
                ]}
              />
            </View>
          ))}
        </View>
      </Section>
    );
  }

  if (budgets.length === 0) {
    return (
      <Section title="Presupuestos">
        <View style={styles.empty}>
          <View
            style={[styles.emptyIcon, { backgroundColor: theme.violet[100] }]}
          >
            <Target size={28} color={theme.violet[600]} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Sin presupuestos
          </Text>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            Crea un presupuesto para controlar tus gastos
          </Text>
          <Button
            variant="secondary"
            size="sm"
            style={styles.emptyButton}
            onPress={onCreateBudget}
          >
            Crear presupuesto
          </Button>
        </View>
      </Section>
    );
  }

  return (
    <Section
      title="Presupuestos"
      action={
        <Text style={[styles.month, { color: theme.textMuted }]}>
          {getMonthLabel(new Date())}
        </Text>
      }
    >
      <View style={styles.list}>
        {budgets.map((budget, index) => {
          const { pct, isOver } = computeBudgetProgress(budget);
          const color = isOver
            ? theme.danger[500]
            : BAR_COLORS[index % BAR_COLORS.length];

          return (
            <View key={budget.id} style={styles.item}>
              <View style={styles.itemHeader}>
                <Text
                  style={[styles.name, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {budget.name}
                </Text>
                <Text
                  style={[
                    styles.value,
                    { color: isOver ? theme.danger[600] : theme.textSecondary },
                  ]}
                >
                  ${formatNumber(budget.spent)} / ${formatNumber(budget.amount)}
                </Text>
              </View>
              <View
                style={[
                  styles.track,
                  { backgroundColor: theme.surfaceRaised },
                ]}
              >
                <View
                  style={[
                    styles.fill,
                    { width: `${pct}%`, backgroundColor: color },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.lg,
  },
  item: {
    gap: spacing.xs + 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    flexShrink: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  value: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  track: {
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
  month: {
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  skeleton: {
    gap: spacing.xs + 2,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  skeletonBar: {
    height: 16,
    borderRadius: radius.sm,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: spacing.sm,
  },
});
