const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export interface FieldError {
  field: string;
  messages: string[];
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: FieldError[] = [],
  ) {
    super(message);
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${API_URL}${path}`);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  return url.toString();
}

/** Called on any 401 so the app can drop cached data and go to /login. */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; query?: Query; skipAuthRedirect?: boolean } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      credentials: 'include', // HttpOnly session cookie
      headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Could not reach the Spendly API. Is it running?');
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && !options.skipAuthRedirect) onUnauthorized?.();
    const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    throw new ApiError(res.status, message || 'Something went wrong', data.errors ?? []);
  }
  return data as T;
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong';
}
