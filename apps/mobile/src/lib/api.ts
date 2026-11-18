import {
  CLIENT_PLATFORM_HEADER,
  CLIENT_PLATFORM_NATIVE,
  api,
  configureApi,
  type Session,
} from '@indenance/core';
import { router } from 'expo-router';

import { useAuthStore } from './auth';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

configureApi({
  baseURL: API_URL,
  withCredentials: false,
  clientPlatform: CLIENT_PLATFORM_NATIVE,
  getAccessToken: () => useAuthStore.getState().accessToken,
  refreshSession: async () => {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [CLIENT_PLATFORM_HEADER]: CLIENT_PLATFORM_NATIVE,
      },
      body: JSON.stringify({
        refreshToken: useAuthStore.getState().refreshToken,
      }),
    });
    if (!response.ok) {
      throw new Error(`refresh failed with status ${response.status}`);
    }
    const data = (await response.json()) as Session;
    useAuthStore.getState().setSession(data);
  },
  onSessionExpired: () => {
    useAuthStore.getState().clearSession();
    router.replace('/login');
  },
});

export { api };

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout', {
      refreshToken: useAuthStore.getState().refreshToken,
    });
  } catch {
    void 0;
  }
  useAuthStore.getState().clearSession();
  router.replace('/');
}
