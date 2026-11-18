import axios from 'axios';
import { configureApi, api } from '@indenance/core';
import { useAuthStore } from '@/stores/auth.store';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

configureApi({
  baseURL,
  withCredentials: true,
  getAccessToken: () => useAuthStore.getState().accessToken,
  refreshSession: async () => {
    const { data } = await axios.post(
      `${baseURL}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    useAuthStore.getState().setSession(data);
  },
  onSessionExpired: () => {
    useAuthStore.getState().clearSession();
    window.location.href = '/login';
  },
});

export { api };
