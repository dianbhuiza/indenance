import { useState, useCallback } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { BalanceCard } from '@/components/dashboard/balance-card';
import { SpendingChart } from '@/components/dashboard/spending-chart';
import { CategoryBreakdown } from '@/components/dashboard/category-breakdown';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { BudgetProgress } from '@/components/dashboard/budget-progress';
import { FloatingActionButton } from '@/components/fab/floating-action-button';
import { useTransactionsQuery } from '@/hooks/use-transactions';
import { useBudgetsQuery } from '@/hooks/use-budgets';
import {
  NewTransactionModal,
  NewShoppingListModal,
  NewBudgetModal,
  NewPlannedTransactionModal,
} from '@/components/modals';

export function DashboardPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const { income, expenses } = useTransactionsQuery();
  useBudgetsQuery();

  const handleFabAction = useCallback((actionId: string) => {
    setActiveModal(actionId);
  }, []);

  const handleModalChange = useCallback((open: boolean) => {
    if (!open) setActiveModal(null);
  }, []);

  return (
    <div className="pb-24 lg:pb-6">
      {/* Header greeting */}
      <div className="mb-6">
        <p className="text-sm text-text-muted">Buenas tardes</p>
        <h1 className="font-display text-2xl text-text">Tu dashboard</h1>
      </div>

      {/* Balance */}
      <div className="mb-6 animate-fade-in">
        <BalanceCard />
      </div>

      {/* Quick stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 animate-fade-in stagger-1">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-100 dark:bg-success-900/30">
              <TrendingUp className="h-3.5 w-3.5 text-success-600" />
            </div>
            <p className="text-xs font-medium text-text-muted">Ingresos</p>
          </div>
          <p className="mt-2 font-display text-xl text-text">
            ${income.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-0.5 text-[10px] font-medium text-text-muted">este mes</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger-100 dark:bg-danger-900/30">
              <TrendingDown className="h-3.5 w-3.5 text-danger-600" />
            </div>
            <p className="text-xs font-medium text-text-muted">Gastos</p>
          </div>
          <p className="mt-2 font-display text-xl text-text">
            ${expenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-0.5 text-[10px] font-medium text-text-muted">este mes</p>
        </div>
      </div>

      {/* Charts */}
      <div className="mb-6 space-y-4">
        <SpendingChart />
        <CategoryBreakdown />
      </div>

      {/* Budgets */}
      <div className="mb-6 animate-fade-in stagger-3">
        <BudgetProgress onCreateBudget={() => setActiveModal('budget')} />
      </div>

      {/* Recent transactions */}
      <div className="animate-fade-in stagger-4">
        <RecentTransactions />
      </div>

      {/* FAB */}
      <FloatingActionButton onAction={handleFabAction} />

      {/* Modals */}
      <NewTransactionModal
        open={activeModal === 'transaction'}
        onOpenChange={handleModalChange}
      />
      <NewShoppingListModal
        open={activeModal === 'shopping'}
        onOpenChange={handleModalChange}
      />
      <NewBudgetModal
        open={activeModal === 'budget'}
        onOpenChange={handleModalChange}
      />
      <NewPlannedTransactionModal
        open={activeModal === 'planned'}
        onOpenChange={handleModalChange}
      />
    </div>
  );
}
