import { useSyncExternalStore } from 'react';

let authenticated = false;
const subscribers = new Set<() => void>();

export function isAuthenticated(): boolean {
  return authenticated;
}

export function setAuthenticated(next: boolean): void {
  if (authenticated === next) return;
  authenticated = next;
  for (const notify of subscribers) notify();
}

function subscribe(notify: () => void): () => void {
  subscribers.add(notify);
  return () => {
    subscribers.delete(notify);
  };
}

export function useIsAuthenticated(): boolean {
  return useSyncExternalStore(subscribe, isAuthenticated, isAuthenticated);
}
