import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useIsAuthenticated } from '../auth/session';
import type { Account } from '../types';
import { queryKeys } from './keys';
import type { QueryToggle } from './options';

async function fetchAccounts(): Promise<Account[]> {
  const { data } = await api.get<Account[]>('/accounts');
  return data;
}

async function createAccount(payload: {
  name: string;
  currency: string;
  balance?: number;
}): Promise<Account> {
  const { data } = await api.post<Account>('/accounts', payload);
  return data;
}

export function useAccountsQuery(toggle?: QueryToggle) {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: fetchAccounts,
    enabled: isAuthenticated && (toggle?.enabled ?? true),
  });
}

export function useCreateAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    },
  });
}
