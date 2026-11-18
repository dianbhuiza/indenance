import { router } from 'expo-router';
import { useEffect } from 'react';

import { useAuthHydration, useAuthStore } from './auth';

export function useAuthGuard(): boolean {
  const hydrated = useAuthHydration();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace('/login');
  }, [hydrated, isAuthenticated]);

  return hydrated && isAuthenticated;
}
