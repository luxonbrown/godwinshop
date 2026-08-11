import * as SecureStore from 'expo-secure-store';
import { COOKIE_NAME } from '../config/api';

const SESSION_COOKIE_KEY = 'godwinshop_session_cookie';
const USER_CACHE_KEY = 'godwinshop_user_cache';

export async function saveSessionCookie(value: string | null): Promise<void> {
  try {
    if (value) {
      await SecureStore.setItemAsync(SESSION_COOKIE_KEY, value);
    } else {
      await SecureStore.deleteItemAsync(SESSION_COOKIE_KEY);
    }
  } catch {
    // SecureStore unavailable (e.g. web preview) — no-op.
  }
}

export async function getSessionCookie(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SESSION_COOKIE_KEY);
  } catch {
    return null;
  }
}

/** Raw header value of the godwinshop.sid cookie captured from Set-Cookie. */
export function extractCookieValue(setCookieHeader: string | null | undefined): string | null {
  if (!setCookieHeader) return null;
  const parts = setCookieHeader.split(';');
  const first = parts[0]?.trim();
  if (!first || !first.startsWith(`${COOKIE_NAME}=`)) return null;
  return first.slice(COOKIE_NAME.length + 1);
}

export async function saveUserCache<T>(data: T): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_CACHE_KEY, JSON.stringify(data));
  } catch {
    /* no-op */
  }
}

export async function getCachedUser<T>(): Promise<T | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function clearUserCache(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(USER_CACHE_KEY);
  } catch {
    /* no-op */
  }
}