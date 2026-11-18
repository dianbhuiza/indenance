import {
  formatAmount,
  useBudgetsQuery,
  useTransactionsQuery,
} from '@indenance/core';
import { LogOut, TrendingDown, TrendingUp } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BalanceCard } from '@/components/dashboard/balance-card';
import { BudgetProgress } from '@/components/dashboard/budget-progress';
import { CategoryBreakdown } from '@/components/dashboard/category-breakdown';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { SpendingChart } from '@/components/dashboard/spending-chart';
import { FloatingActionButton } from '@/components/fab/floating-action-button';
import {
  NewBudgetModal,
  NewLoanModal,
  NewPlannedTransactionModal,
  NewShoppingListModal,
  NewTransactionModal,
} from '@/components/modals';
import { RequireAccounts } from '@/components/require-accounts';
import type { IconType } from '@/components/ui';
import { logout } from '@/lib/api';
import { useAuthGuard } from '@/lib/guards';
import { useAuthStore } from '@/lib/auth';
import { fonts, radius, shadow, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function TopBar({ label }: { label: string }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.topbar,
        {
          paddingTop: insets.top + spacing.sm,
          backgroundColor: theme.surface,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <Text style={[styles.brand, { color: theme.primary[600] }]}>Indenance</Text>
      <View style={styles.topbarRight}>
        <Text
          style={[styles.user, { color: theme.textSecondary }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Pressable
          hitSlop={10}
          onPress={() => void logout()}
          style={styles.logout}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
        >
          <LogOut size={18} color={theme.danger[600]} />
        </Pressable>
      </View>
    </View>
  );
}

function StatCard({
  icon: Icon,
  label,
  amount,
  tone,
}: {
  icon: IconType;
  label: string;
  amount: number;
  tone: 'success' | 'danger';
}) {
  const theme = useTheme();
  const palette =
    tone === 'success'
      ? { bg: theme.success[100], fg: theme.success[600] }
      : { bg: theme.danger[100], fg: theme.danger[600] };

  return (
    <View
      style={[
        styles.stat,
        shadow.xs,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: palette.bg }]}>
          <Icon size={14} color={palette.fg} strokeWidth={2.5} />
        </View>
        <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
      </View>
      <Text style={[styles.statAmount, { color: theme.text }]}>
        ${formatAmount(amount)}
      </Text>
      <Text style={[styles.statFoot, { color: theme.textMuted }]}>este mes</Text>
    </View>
  );
}

export default function DashboardPage() {
  const theme = useTheme();
  const ready = useAuthGuard();
  const user = useAuthStore((state) => state.user);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const { income, expenses } = useTransactionsQuery();
  useBudgetsQuery();

  const handleModalChange = useCallback((open: boolean) => {
    if (!open) setActiveModal(null);
  }, []);

  if (!ready) {
    return <View style={[styles.boot, { backgroundColor: theme.bg }]} />;
  }

  return (
    <RequireAccounts>
      <View style={[styles.screen, { backgroundColor: theme.bg }]}>
        <TopBar label={user?.name ?? user?.email ?? ''} />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.greeting}>
            <Text style={[styles.greetingText, { color: theme.textMuted }]}>
              {greeting()}
            </Text>
            <Text style={[styles.heading, { color: theme.text }]}>
              Tu dashboard
            </Text>
          </View>

          <BalanceCard />

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <StatCard
                icon={TrendingUp}
                label="Ingresos"
                amount={income}
                tone="success"
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                icon={TrendingDown}
                label="Gastos"
                amount={expenses}
                tone="danger"
              />
            </View>
          </View>

          <SpendingChart />
          <CategoryBreakdown />
          <BudgetProgress onCreateBudget={() => setActiveModal('budget')} />
          <RecentTransactions />
        </ScrollView>

        <FloatingActionButton onAction={setActiveModal} />

        <NewTransactionModal
          open={activeModal === 'transaction'}
          onClose={() => handleModalChange(false)}
        />
        <NewLoanModal
          open={activeModal === 'loan'}
          onClose={() => handleModalChange(false)}
        />
        <NewShoppingListModal
          open={activeModal === 'shopping'}
          onClose={() => handleModalChange(false)}
        />
        <NewBudgetModal
          open={activeModal === 'budget'}
          onClose={() => handleModalChange(false)}
        />
        <NewPlannedTransactionModal
          open={activeModal === 'planned'}
          onClose={() => handleModalChange(false)}
        />
      </View>
    </RequireAccounts>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  boot: {
    flex: 1,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brand: {
    fontSize: 20,
    fontFamily: fonts.bold,
  },
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexShrink: 1,
  },
  user: {
    fontSize: 14,
    fontFamily: fonts.regular,
    flexShrink: 1,
  },
  logout: {
    padding: 4,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 140,
  },
  greeting: {
    gap: 2,
  },
  greetingText: {
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  heading: {
    fontSize: 26,
    fontFamily: fonts.display,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
  },
  stat: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.xs,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  statAmount: {
    fontSize: 22,
    fontFamily: fonts.display,
  },
  statFoot: {
    fontSize: 10,
    fontFamily: fonts.medium,
  },
});
