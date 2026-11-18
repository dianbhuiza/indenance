import { formatAmount, useAccountsQuery } from '@indenance/core';
import { Wallet } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { fonts, radius, spacing } from '@/theme/tokens';

export function BalanceCard() {
  const { data: accounts = [] } = useAccountsQuery();
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <LinearGradient
      colors={['#0d9488', '#0f766e', '#115e59']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.circleTop} />
      <View style={styles.circleBottom} />

      <View style={styles.body}>
        <Text style={styles.label}>Balance total</Text>
        <Text style={styles.amount}>${formatAmount(totalBalance)}</Text>
      </View>

      {accounts.length > 0 && (
        <View style={styles.accounts}>
          {accounts.map((account) => (
            <View key={account.id} style={styles.accountRow}>
              <View style={styles.accountLeft}>
                <View style={styles.accountIcon}>
                  <Wallet size={14} color="#ffffff" />
                </View>
                <Text style={styles.accountName} numberOfLines={1}>
                  {account.name}
                </Text>
              </View>
              <View style={styles.accountRight}>
                <Text style={styles.accountAmount}>
                  ${formatAmount(account.balance)}
                </Text>
                <Text style={styles.accountCurrency}>{account.currency}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius['2xl'],
    padding: spacing.xl,
    overflow: 'hidden',
  },
  circleTop: {
    position: 'absolute',
    top: -32,
    right: -32,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  circleBottom: {
    position: 'absolute',
    bottom: -16,
    right: -16,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  body: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#99f6e4',
  },
  amount: {
    fontSize: 36,
    lineHeight: 42,
    fontFamily: fonts.display,
    color: '#ffffff',
  },
  accounts: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.18)',
    gap: spacing.sm,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  accountIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountName: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#ccfbf1',
    flexShrink: 1,
  },
  accountRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  accountAmount: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: '#ffffff',
  },
  accountCurrency: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: '#5eead4',
  },
});
