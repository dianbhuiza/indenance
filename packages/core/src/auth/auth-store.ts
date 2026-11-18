import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { Session, Tenant, User } from '../types';
import { setAuthenticated } from './session';

export interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setSession: (data: Session) => void;
  clearSession: () => void;
}

export function createAuthStore(
  storage?: StateStorage,
  options?: { persistTokens?: boolean },
) {
  const persistTokens = options?.persistTokens ?? true;
  return create<AuthState>()(
    persist(
      (set) => ({
        user: null,
        tenant: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,

        setSession: (data) => {
          setAuthenticated(true);
          set({
            user: data.user,
            tenant: data.tenant,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken ?? null,
            isAuthenticated: true,
          });
        },

        clearSession: () => {
          setAuthenticated(false);
          set({
            user: null,
            tenant: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        },
      }),
      {
        name: 'indenance-auth',
        partialize: (state) => ({
          user: state.user,
          tenant: state.tenant,
          accessToken: persistTokens ? state.accessToken : null,
          refreshToken: persistTokens ? state.refreshToken : null,
          isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (state) => {
          setAuthenticated(state?.isAuthenticated ?? false);
        },
        ...(storage ? { storage: createJSONStorage(() => storage) } : {}),
      },
    ),
  );
}
