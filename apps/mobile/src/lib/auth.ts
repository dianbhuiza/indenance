import { createAuthStore } from '@indenance/core';
import { useEffect, useState } from 'react';

import { zustandStorage } from './storage';

export const useAuthStore = createAuthStore(zustandStorage);

export function useAuthHydration(): boolean {
  const [hydrated, setHydrated] = useState(() =>
    useAuthStore.persist.hasHydrated(),
  );

  useEffect(() => {
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}
