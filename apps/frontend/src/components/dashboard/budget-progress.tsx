import { Target } from 'lucide-react';
import { useBudgetsQuery } from '@/hooks/use-budgets';
import { Button } from '@/components/ui';

const colorMap = {
  primary: { bar: 'bg-primary-500', bg: 'bg-primary-100 dark:bg-primary-900/30', text: 'text-primary-700 dark:text-primary-300' },
  accent: { bar: 'bg-accent-500', bg: 'bg-accent-100 dark:bg-accent-900/30', text: 'text-accent-700 dark:text-accent-300' },
  violet: { bar: 'bg-violet-500', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300' },
  amber: { bar: 'bg-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
};

const COLORS = ['primary', 'accent', 'violet', 'amber'] as const;

interface BudgetProgressProps {
  onCreateBudget?: () => void;
}

export function BudgetProgress({ onCreateBudget }: BudgetProgressProps) {
  const { data: budgets = [], isLoading } = useBudgetsQuery();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="mb-4 font-display text-lg text-text">Presupuestos</h3>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="mb-1.5 flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-surface-raised" />
                <div className="h-3 w-16 rounded bg-surface-raised" />
              </div>
              <div className="h-2 rounded-full bg-surface-raised" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="mb-4 font-display text-lg text-text">Presupuestos</h3>
        <div className="flex flex-col items-center py-6 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/30">
            <Target className="h-7 w-7 text-violet-600" />
          </div>
          <p className="text-sm font-medium text-text">Sin presupuestos</p>
          <p className="mt-1 text-xs text-text-muted">
            Crea un presupuesto para controlar tus gastos
          </p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={onCreateBudget}>
            Crear presupuesto
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg text-text">Presupuestos</h3>
        <span className="text-xs text-text-muted">Septiembre</span>
      </div>

      <div className="space-y-4">
        {budgets.map((budget, i) => {
          const pct = budget.amount > 0 ? Math.min((budget.spent / budget.amount) * 100, 100) : 0;
          const isOver = budget.isExceeded;
          const colors = colorMap[COLORS[i % COLORS.length]];

          return (
            <div key={budget.id}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-text">{budget.name}</span>
                <span className={`text-xs font-medium ${isOver ? 'text-danger-600' : 'text-text-secondary'}`}>
                  ${budget.spent.toLocaleString('es-MX')} / ${budget.amount.toLocaleString('es-MX')}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-raised">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${isOver ? 'bg-danger-500' : colors.bar}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
