import { API_BASE_URL } from '../config/api';
import { getSessionCookie, saveSessionCookie } from '../lib/secureStorage';
import { ApiErrorPayload } from '../types';

export interface ApiRequestOptions {
  method?: string;
  body?: unknown;
  /** Skip storing any session cookie captured from the response. */
  skipCookieCapture?: boolean;
}

export class GodwinshopApiError extends Error {
  code?: string;
  status?: number;
  errors?: { field?: string; message?: string }[];

  constructor(payload: ApiErrorPayload) {
    super(payload.message || 'Something went wrong. Please try again.');
    this.name = 'GodwinshopApiError';
    this.code = payload.code;
    this.status = payload.status;
    this.errors = payload.errors;
  }
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

/**
 * Fetch wrapper used by every API call.
 *
 * The Godwinshop backend authenticates with an HTTP-only session cookie
 * (express-session + MySQLStore). React Native does not persist cookies
 * automatically, so we capture the session cookie from the login response
 * (exposed as `session_cookie`) and re-send it as a `Cookie` header on
 * every request.
 */
export async function request<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  const { method = 'GET', body, skipCookieCapture = false } = options ?? {};

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const cookie = await getSessionCookie();
  if (cookie) headers['Cookie'] = cookie;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      // React Native silently ignores this; kept for web parity.
      credentials: 'include'
    });
  } catch {
    throw new GodwinshopApiError({ message: 'Cannot reach the server. Check your connection and try again.', code: 'NETWORK_ERROR' });
  }

  if (!skipCookieCapture) {
    const cookieHeader = response.headers.get('set-cookie') || response.headers.get('Set-Cookie');
    const captured = cookieHeader?.split(';')[0] ?? null;
    if (captured && captured.startsWith('godwinshop.sid=')) {
      await saveSessionCookie(captured);
    }
  }

  let data: ApiErrorPayload & T = null as unknown as ApiErrorPayload & T;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text } as never;
    }
  }

  if (response.status === 401) {
    await saveSessionCookie(null);
    if (onUnauthorized) onUnauthorized();
  }

  if (!response.ok) {
    throw new GodwinshopApiError({
      message: data.message || 'Something went wrong. Please try again.',
      code: data.code,
      status: response.status,
      errors: data.errors
    });
  }

  return data;
}