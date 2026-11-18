import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useIsAuthenticated } from '../auth/session';
import type { Budget } from '../types';
import { queryKeys } from './keys';
import type { QueryToggle } from './options';

export function useBudgetsQuery(toggle?: QueryToggle) {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: queryKeys.budgets,
    queryFn: async (): Promise<Budget[]> => {
      const { data } = await api.get<Budget[]>('/budgets');
      return data;
    },
    enabled: isAuthenticated && (toggle?.enabled ?? true),
  });
}
