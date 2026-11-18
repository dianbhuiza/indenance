import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useIsAuthenticated } from '../auth/session';
import type { Category } from '../types';
import { queryKeys } from './keys';
import type { QueryToggle } from './options';

export function useCategoriesQuery(toggle?: QueryToggle) {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async (): Promise<Category[]> => {
      const { data } = await api.get<Category[]>('/categories');
      return data;
    },
    enabled: isAuthenticated && (toggle?.enabled ?? true),
  });
}
