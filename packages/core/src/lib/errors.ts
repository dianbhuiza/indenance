interface ApiErrorResponse {
  status?: number;
  data?: { message?: string | string[] };
}

interface ApiErrorShape {
  response?: ApiErrorResponse;
}

export interface ApiErrorInfo {
  status?: number;
  message?: string | string[];
}

export function getApiError(err: unknown): ApiErrorInfo {
  const response = (err as ApiErrorShape | null)?.response;
  return {
    status: response?.status,
    message: response?.data?.message,
  };
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  const { message } = getApiError(err);
  if (Array.isArray(message)) return message.join(', ');
  return message ?? fallback;
}
