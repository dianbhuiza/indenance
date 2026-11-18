import {
  UNASSIGNED_CATEGORY,
  formatAmount,
  formatDayMonth,
  getCategoryIcon,
  useTransactionsQuery,
} from '@indenance/core';
import { ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Section } from '@/components/dashboard/section';
import { fonts, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export function RecentTransactions() {
  const theme = useTheme();
  const { transactions } = useTransactionsQuery();
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? transactions : transactions.slice(0, 5);
  const hasMore = transactions.length > 5;

  if (visible.length === 0) {
    return (
      <Section title="Transacciones recientes">
        <Text style={[styles.empty, { color: theme.textMuted }]}>
          Aún no hay transacciones
        </Text>
      </Section>
    );
  }

  return (
    <Section
      title="Transacciones recientes"
      action={
        hasMore ? (
          <Pressable
            onPress={() => setExpanded((prev) => !prev)}
            hitSlop={8}
            style={styles.action}
            accessibilityRole="button"
          >
            <Text style={[styles.actionText, { color: theme.primary[600] }]}>
              {expanded ? 'Ver menos' : 'Ver todo'}
            </Text>
            <ChevronRight
              size={14}
              color={theme.primary[600]}
              style={expanded ? styles.actionIconDown : undefined}
            />
          </Pressable>
        ) : null
      }
    >
      <View style={styles.list}>
        {visible.map((tx) => {
          const icon = getCategoryIcon(tx.category?.name);
          const isIncome = tx.type === 'INCOME';

          return (
            <View key={tx.id} style={styles.row}>
              <View style={[styles.iconTile, { backgroundColor: theme.surfaceRaised }]}>
                <Text style={styles.icon}>{icon}</Text>
              </View>

              <View style={styles.info}>
                <Text
                  style={[styles.title, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {tx.category?.name ?? UNASSIGNED_CATEGORY}
                </Text>
                <View style={styles.meta}>
                  <Text style={[styles.metaText, { color: theme.textMuted }]}>
                    {tx.account.name}
                  </Text>
                  <Text style={[styles.metaText, { color: theme.textMuted }]}>
                    ·
                  </Text>
                  <Text style={[styles.metaText, { color: theme.textMuted }]}>
                    {formatDayMonth(tx.createdAt)}
                  </Text>
                </View>
              </View>

              <View style={styles.amounts}>
                <Text
                  style={[
                    styles.amount,
                    {
                      color: isIncome ? theme.success[600] : theme.text,
                    },
                  ]}
                >
                  {isIncome ? '+' : '-'}${formatAmount(tx.amount)}
                </Text>
                <Text style={[styles.currency, { color: theme.textMuted }]}>
                  {tx.account.currency}
                </Text>
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
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    lineHeight: 22,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  amounts: {
    alignItems: 'flex-end',
    gap: 2,
  },
  amount: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
  },
  currency: {
    fontSize: 10,
    fontFamily: fonts.regular,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: spacing.lg,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  actionIconDown: {
    transform: [{ rotate: '90deg' }],
  },
});
