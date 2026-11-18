import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { CLIENT_PLATFORM_HEADER } from '../constants/platform';

export interface ApiClientOptions {
  baseURL?: string;
  withCredentials?: boolean;
  clientPlatform?: string;
  getAccessToken?: () => string | null | undefined;
  refreshSession?: () => Promise<void>;
  onSessionExpired?: () => void;
  noRefreshUrls?: string[];
}

const DEFAULT_NO_REFRESH_URLS = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password',
];

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

let options: ApiClientOptions = { noRefreshUrls: DEFAULT_NO_REFRESH_URLS };

export const api: AxiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

export function configureApi(next: ApiClientOptions): void {
  options = { ...options, ...next };
  if (next.baseURL !== undefined) api.defaults.baseURL = next.baseURL;
  if (next.withCredentials !== undefined) {
    api.defaults.withCredentials = next.withCredentials;
  }
  if (next.clientPlatform !== undefined) {
    api.defaults.headers.common[CLIENT_PLATFORM_HEADER] = next.clientPlatform;
  }
}

api.interceptors.request.use((config) => {
  const token = options.getAccessToken?.();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequest | undefined;
    const requestUrl = originalRequest?.url ?? '';
    const isPublicAuthRequest =
      options.noRefreshUrls?.some((url) => requestUrl.startsWith(url)) ?? false;
    const canRefresh = Boolean(options.refreshSession);

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isPublicAuthRequest &&
      canRefresh
    ) {
      originalRequest._retry = true;

      try {
        await options.refreshSession?.();
        const token = options.getAccessToken?.();
        if (token) originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch {
        options.onSessionExpired?.();
      }
    }

    return Promise.reject(error);
  },
);
