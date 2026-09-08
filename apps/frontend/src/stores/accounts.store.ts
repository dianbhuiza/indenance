import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from './auth.store';

export interface Account {
  id: string;
  userId: string;
  tenantId: string;
  name: string;
  currency: string;
  balance: number;
  createdAt: string;
}

async function fetchAccounts(): Promise<Account[]> {
  const { data } = await api.get('/accounts');
  return data;
}

async function createAccount(payload: {
  name: string;
  currency: string;
  balance?: number;
}): Promise<Account> {
  const { data } = await api.post('/accounts', payload);
  return data;
}

export function useAccountsQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
    enabled: isAuthenticated,
  });
}

export function useCreateAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
