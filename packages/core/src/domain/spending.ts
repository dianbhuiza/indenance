import type { CategorySpending, MonthlySpending, Transaction } from '../types';
import { getMonthKey, getMonthLabel } from './dates';
import { getCategoryColor, UNASSIGNED_CATEGORY } from './category-meta';

const MONTH_WINDOW = [2, 1, 0];

export function computeMonthlySpending(
  transactions: Transaction[],
  reference: Date = new Date(),
): MonthlySpending[] {
  const months = MONTH_WINDOW.map((offset) => {
    const d = new Date(reference.getFullYear(), reference.getMonth() - offset, 1);
    return { label: getMonthLabel(d), key: getMonthKey(d) };
  });

  return months.map(({ label, key }) => {
    const amount = transactions
      .filter(
        (t) => getMonthKey(new Date(t.createdAt)) === key && t.type === 'EXPENSE',
      )
      .reduce((sum, t) => sum + t.amount, 0);
    return { month: label, amount };
  });
}

export function computeCategorySpending(
  transactions: Transaction[],
  reference: Date = new Date(),
): CategorySpending[] {
  const currentMonthKey = getMonthKey(reference);

  const expenses = transactions.filter(
    (t) =>
      getMonthKey(new Date(t.createdAt)) === currentMonthKey && t.type === 'EXPENSE',
  );

  const total = expenses.reduce((sum, t) => sum + t.amount, 0);
  if (total === 0) return [];

  const grouped = new Map<string, number>();
  for (const t of expenses) {
    const category = t.category?.name ?? UNASSIGNED_CATEGORY;
    grouped.set(category, (grouped.get(category) ?? 0) + t.amount);
  }

  return Array.from(grouped.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      color: getCategoryColor(category),
      percentage: Math.round((amount / total) * 1000) / 10,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export interface MonthTotals {
  income: number;
  expenses: number;
}

export function computeMonthTotals(
  transactions: Transaction[],
  reference: Date = new Date(),
): MonthTotals {
  const key = getMonthKey(reference);
  const monthTx = transactions.filter(
    (t) => getMonthKey(new Date(t.createdAt)) === key,
  );

  return {
    income: monthTx
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0),
    expenses: monthTx
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0),
  };
}
