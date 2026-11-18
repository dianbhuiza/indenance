import { createAuthStore } from '@indenance/core';

export const useAuthStore = createAuthStore(undefined, { persistTokens: false });
