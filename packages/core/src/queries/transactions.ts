import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useIsAuthenticated } from '../auth/session';
import {
  computeCategorySpending,
  computeMonthTotals,
  computeMonthlySpending,
} from '../domain/spending';
import type { Transaction } from '../types';
import { queryKeys } from './keys';

export function useTransactionsQuery() {
  const isAuthenticated = useIsAuthenticated();

  const query = useQuery({
    queryKey: queryKeys.transactions,
    queryFn: async (): Promise<Transaction[]> => {
      const { data } = await api.get<Transaction[]>('/transactions');
      return data;
    },
    enabled: isAuthenticated,
  });

  const transactions = query.data ?? [];
  const { income, expenses } = computeMonthTotals(transactions);

  return {
    ...query,
    transactions,
    income,
    expenses,
    monthlySpending: computeMonthlySpending(transactions),
    categorySpending: computeCategorySpending(transactions),
  };
}
