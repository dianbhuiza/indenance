import type { Budget } from '../types';

export interface BudgetProgress {
  pct: number;
  isOver: boolean;
}

export function computeBudgetProgress(budget: Budget): BudgetProgress {
  const pct =
    budget.amount > 0 ? Math.min((budget.spent / budget.amount) * 100, 100) : 0;

  return { pct, isOver: budget.isExceeded };
}
