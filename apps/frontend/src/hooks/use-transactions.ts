import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  createdAt: string;
  categoryId: string | null;
  tenantId: string;
  account: { id: string; name: string; currency: string };
  category: { id: string; name: string } | null;
}

export interface MonthlySpending {
  month: string;
  amount: number;
}

export interface CategorySpending {
  category: string;
  amount: number;
  color: string;
  percentage: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Alimentación: 'var(--color-primary-500)',
  Transporte: 'var(--color-accent-500)',
  Entretenimiento: 'var(--color-violet-500)',
  Salud: 'var(--color-pink-500)',
  Servicios: 'var(--color-amber-500)',
  Educación: 'var(--color-emerald-500)',
  Hogar: 'var(--color-orange-500)',
  Otros: 'var(--color-neutral-400)',
  Salario: 'var(--color-success-500)',
  Freelance: 'var(--color-teal-500)',
};

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function computeMonthlySpending(transactions: Transaction[]): MonthlySpending[] {
  const months = [2, 1, 0].map((offset) => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return { label: getMonthLabel(d), key: getMonthKey(d) };
  });

  return months.map(({ label, key }) => {
    const monthTx = transactions.filter((t) => {
      const d = new Date(t.createdAt);
      return getMonthKey(d) === key && t.type === 'EXPENSE';
    });
    return { month: label, amount: monthTx.reduce((sum, t) => sum + t.amount, 0) };
  });
}

function computeCategorySpending(transactions: Transaction[]): CategorySpending[] {
  const now = new Date();
  const currentMonthKey = getMonthKey(now);

  const expenses = transactions.filter((t) => {
    const d = new Date(t.createdAt);
    return getMonthKey(d) === currentMonthKey && t.type === 'EXPENSE';
  });

  const grouped = new Map<string, number>();
  for (const t of expenses) {
    const cat = t.category?.name ?? 'Sin categoría';
    grouped.set(cat, (grouped.get(cat) ?? 0) + t.amount);
  }

  const total = expenses.reduce((sum, t) => sum + t.amount, 0);
  if (total === 0) return [];

  const entries = Array.from(grouped.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      color: CATEGORY_COLORS[category] ?? 'var(--color-neutral-400)',
      percentage: Math.round((amount / total) * 1000) / 10,
    }))
    .sort((a, b) => b.amount - a.amount);

  return entries;
}

export function useTransactionsQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const query = useQuery({
    queryKey: ['transactions'],
    queryFn: async (): Promise<Transaction[]> => {
      const { data } = await api.get('/transactions');
      return data;
    },
    enabled: isAuthenticated,
  });

  const transactions = query.data ?? [];
  const now = new Date();
  const currentMonthTx = transactions.filter((t) => {
    const d = new Date(t.createdAt);
    return getMonthKey(d) === getMonthKey(now);
  });

  const income = currentMonthTx
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = currentMonthTx
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    ...query,
    transactions,
    income,
    expenses,
    monthlySpending: computeMonthlySpending(transactions),
    categorySpending: computeCategorySpending(transactions),
  };
}
