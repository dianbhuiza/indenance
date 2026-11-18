import type { Request } from 'express';

export const CLIENT_PLATFORM_HEADER = 'x-client-platform';
export const NATIVE_CLIENT_PLATFORM = 'native';

export function isNativeClient(req: Request): boolean {
  const header = req.headers[CLIENT_PLATFORM_HEADER];
  const value = Array.isArray(header) ? header[0] : header;
  return (
    typeof value === 'string' && value.toLowerCase() === NATIVE_CLIENT_PLATFORM
  );
}
