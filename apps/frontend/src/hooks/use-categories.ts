import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export interface Category {
  id: string;
  name: string;
  tenantId: string;
}

export function useCategoriesQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data } = await api.get('/categories');
      return data;
    },
    enabled: isAuthenticated,
  });
}
