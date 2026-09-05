import { getPublicEnvironment } from '../config/index.ts';

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { apiUrl } = getPublicEnvironment();
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { code?: unknown; message?: unknown };
    } | null;
    const code = typeof body?.error?.code === 'string' ? body.error.code : 'API_REQUEST_FAILED';
    const message =
      typeof body?.error?.message === 'string'
        ? body.error.message
        : `API request failed with status ${response.status}`;
    throw new ApiError(response.status, code, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
