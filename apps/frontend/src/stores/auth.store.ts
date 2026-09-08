import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
}

export interface Tenant {
  id: string;
  name: string;
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setSession: (data: {
    user: User;
    tenant: Tenant | null;
    accessToken: string;
  }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      accessToken: null,
      isAuthenticated: false,

      setSession: (data) =>
        set({
          user: data.user,
          tenant: data.tenant,
          accessToken: data.accessToken,
          isAuthenticated: true,
        }),

      clearSession: () =>
        set({
          user: null,
          tenant: null,
          accessToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'indenance-auth',
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
