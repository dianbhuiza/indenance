import {
  computeMonthlySpending,
  formatCompactAmount,
  useTransactionsQuery,
} from '@indenance/core';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AccountFilter } from '@/components/dashboard/account-filter';
import { Section } from '@/components/dashboard/section';
import { fonts, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export function SpendingChart() {
  const theme = useTheme();
  const { transactions } = useTransactionsQuery();
  const [accountId, setAccountId] = useState('');

  const filtered = useMemo(() => {
    if (!accountId) return transactions;
    return transactions.filter((tx) => tx.accountId === accountId);
  }, [transactions, accountId]);

  const monthlySpending = useMemo(
    () => computeMonthlySpending(filtered),
    [filtered],
  );

  const maxAmount = Math.max(...monthlySpending.map((m) => m.amount), 1);

  const inactiveColors: [string, string] =
    theme.scheme === 'dark'
      ? ['#44403c', '#57534e']
      : ['#e7e5e4', '#f5f5f4'];

  return (
    <Section
      title="Gastos mensuales"
      action={<AccountFilter value={accountId} onValueChange={setAccountId} />}
    >
      <View style={styles.chart}>
        {monthlySpending.map((month) => {
          const ratio = maxAmount > 0 ? month.amount / maxAmount : 0;
          const isHighest = month.amount === maxAmount && month.amount > 0;

          return (
            <View key={month.month} style={styles.column}>
              <Text style={[styles.amount, { color: theme.textSecondary }]}>
                {formatCompactAmount(month.amount)}
              </Text>
              <View style={styles.track}>
                <LinearGradient
                  colors={
                    isHighest
                      ? ['#0d9488', '#2dd4bf']
                      : inactiveColors
                  }
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                  style={[
                    styles.bar,
                    { height: `${Math.max(ratio, 0.04) * 100}%` },
                  ]}
                />
              </View>
              <Text style={[styles.month, { color: theme.textMuted }]}>
                {month.month}
              </Text>
            </View>
          );
        })}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    height: 150,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    height: '100%',
    justifyContent: 'flex-end',
  },
  amount: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  track: {
    width: '100%',
    height: 100,
    borderRadius: radius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: radius.lg,
  },
  month: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
});
