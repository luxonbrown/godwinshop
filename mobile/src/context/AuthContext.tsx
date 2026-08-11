import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../api';
import { clearUserCache, getCachedUser, getSessionCookie, saveSessionCookie, saveUserCache } from '../lib/secureStorage';
import { User } from '../types';
import { GodwinshopApiError, setUnauthorizedHandler } from '../lib/http';

interface AuthContextValue {
  /** A cached or freshly fetched public user, or null when signed out. */
  user: User | null;
  /** True while restoring the session on launch. */
  restoring: boolean;
  signedIn: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  refresh: () => Promise<User | null>;
  applyUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(true);

  const applyUser = useCallback((next: User | null) => {
    setUser(next);
    if (next) void saveUserCache(next);
    else void clearUserCache();
  }, []);

  const refresh = useCallback(async (): Promise<User | null> => {
    const cookie = await getSessionCookie();
    if (!cookie) {
      setUser(null);
      return null;
    }
    try {
      const res = await api.fetchCurrentSession();
      if (res.authenticated && res.user) {
        applyUser(res.user);
        return res.user;
      }
      await saveSessionCookie(null);
      setUser(null);
      return null;
    } catch {
      setUser(null);
      return null;
    }
  }, [applyUser]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<User> => {
      let res;
      try {
        res = await api.login(email, password);
      } catch (err) {
        // Propagate graceful errors (bad credentials, disabled account, network).
        throw err;
      }
      applyUser(res.user);
      return res.user;
    },
    [applyUser]
  );

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Local sign-out must succeed even if the network is down.
    }
    await saveSessionCookie(null);
    applyUser(null);
  }, [applyUser]);

  // Restore session on launch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await getCachedUser<User>();
      if (cancelled) return;
      if (!cached) {
        setUser(null);
        setRestoring(false);
        return;
      }
      // Show cached user immediately, then revalidate against the API.
      setUser(cached);
      const cookie = await getSessionCookie();
      if (!cookie) {
        await clearUserCache();
        setUser(null);
        setRestoring(false);
        return;
      }
      try {
        const res = await api.fetchCurrentSession();
        if (cancelled) return;
        if (res.authenticated && res.user) {
          applyUser(res.user);
        } else {
          await saveSessionCookie(null);
          setUser(null);
        }
      } catch {
        if (cancelled) return;
        // Network hiccup: keep cached user, they can refresh later.
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyUser]);

  // Any 401 from a protected API call means the session expired —
  // drop the user state so the navigator returns to the auth stack.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearUserCache();
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, restoring, signedIn: !!user, signIn, signOut, refresh, applyUser }),
    [user, restoring, signIn, signOut, refresh, applyUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export { GodwinshopApiError };