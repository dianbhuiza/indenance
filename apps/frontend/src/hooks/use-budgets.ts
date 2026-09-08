import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export interface Budget {
  id: string;
  name: string;
  amount: number;
  startDate: string;
  endDate: string | null;
  isRecurring: boolean;
  interval: string | null;
  exceededAt: string | null;
  tenantId: string;
  categoryId: string | null;
  spent: number;
  remaining: number;
  isExceeded: boolean;
}

export function useBudgetsQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['budgets'],
    queryFn: async (): Promise<Budget[]> => {
      const { data } = await api.get('/budgets');
      return data;
    },
    enabled: isAuthenticated,
  });
}
