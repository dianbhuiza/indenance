import {
  computeCategorySpending,
  formatCompactAmount,
  useTransactionsQuery,
} from '@indenance/core';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Circle, G, Svg } from 'react-native-svg';

import { AccountFilter } from '@/components/dashboard/account-filter';
import { Section } from '@/components/dashboard/section';
import { fonts, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

const SIZE = 116;
const RADIUS = 46;
const STROKE = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CategoryBreakdown() {
  const theme = useTheme();
  const { transactions } = useTransactionsQuery();
  const [accountId, setAccountId] = useState('');

  const filtered = useMemo(() => {
    if (!accountId) return transactions;
    return transactions.filter((tx) => tx.accountId === accountId);
  }, [transactions, accountId]);

  const { entries, total } = useMemo(() => {
    const computed = computeCategorySpending(filtered);
    return {
      entries: computed,
      total: computed.reduce((sum, entry) => sum + entry.amount, 0),
    };
  }, [filtered]);

  const lengths = entries.map(
    (entry) => (entry.amount / Math.max(total, 1)) * CIRCUMFERENCE,
  );
  const segments = entries.map((entry, index) => ({
    ...entry,
    length: lengths[index],
    offset: lengths
      .slice(0, index)
      .reduce((sum, length) => sum + length, 0),
  }));

  return (
    <Section
      title="Por categoría"
      action={<AccountFilter value={accountId} onValueChange={setAccountId} />}
    >
      {entries.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textMuted }]}>
          Sin gastos este mes
        </Text>
      ) : (
        <View style={styles.body}>
          <View style={styles.donut}>
            <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              <G transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
                <Circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke={theme.border}
                  strokeWidth={STROKE}
                  fill="none"
                />
                {segments.map((segment) => (
                  <Circle
                    key={segment.category}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    stroke={segment.color}
                    strokeWidth={STROKE}
                    fill="none"
                    strokeDasharray={`${segment.length} ${CIRCUMFERENCE - segment.length}`}
                    strokeDashoffset={-segment.offset}
                  />
                ))}
              </G>
            </Svg>
            <View style={styles.donutCenter} pointerEvents="none">
              <Text
                style={[styles.donutTotal, { color: theme.text }]}
                numberOfLines={1}
              >
                {formatCompactAmount(total)}
              </Text>
            </View>
          </View>

          <View style={styles.legend}>
            {entries.map((entry) => (
              <View key={entry.category} style={styles.legendRow}>
                <View style={styles.legendLeft}>
                  <View
                    style={[styles.dot, { backgroundColor: entry.color }]}
                  />
                  <Text
                    style={[styles.legendLabel, { color: theme.textSecondary }]}
                    numberOfLines={1}
                  >
                    {entry.category}
                  </Text>
                </View>
                <Text style={[styles.legendValue, { color: theme.text }]}>
                  {entry.percentage}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  donut: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutTotal: {
    fontSize: 17,
    fontFamily: fonts.display,
  },
  legend: {
    flex: 1,
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flexShrink: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  legendValue: {
    fontSize: 14,
    fontFamily: fonts.semibold,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: spacing.xl,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
});
