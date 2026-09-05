import { useCallback, useEffect, useState } from 'react';

import type { Session, SignUpResult } from '../../../shared/api/index.ts';
import {
  refreshSession,
  requestPasswordRecovery,
  signIn,
  signOut,
  signUp,
  updatePassword,
} from '../api/auth-api.ts';
import { clearSession, loadSession, saveSession } from './session-storage.ts';
import { getSessionRefreshDelay } from './session-refresh.ts';

export type AuthStatus = 'restoring' | 'anonymous' | 'authenticated';

export function useAuthSession() {
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    void (async () => {
      const storedSession = await loadSession();
      if (!storedSession) {
        setStatus('anonymous');
        return;
      }

      try {
        const renewedSession = await refreshSession(storedSession.refreshToken);
        await saveSession(renewedSession);
        setSession(renewedSession);
        setStatus('authenticated');
      } catch {
        await clearSession();
        setStatus('anonymous');
      }
    })();
  }, []);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      void refreshSession(session.refreshToken)
        .then(async (renewedSession) => {
          if (cancelled) return;
          await saveSession(renewedSession);
          if (!cancelled) setSession(renewedSession);
        })
        .catch(async () => {
          if (cancelled) return;
          await clearSession();
          if (!cancelled) {
            setSession(null);
            setStatus('anonymous');
          }
        });
    }, getSessionRefreshDelay(session.expiresAt));

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [session]);

  const authenticate = useCallback(async (email: string, password: string) => {
    const authenticatedSession = await signIn({ email, password });
    await saveSession(authenticatedSession);
    setSession(authenticatedSession);
    setStatus('authenticated');
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName: string): Promise<SignUpResult> => {
      const result = await signUp({
        email,
        password,
        ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
      });
      if (result.session) {
        await saveSession(result.session);
        setSession(result.session);
        setStatus('authenticated');
      }
      return result;
    },
    [],
  );

  const logout = useCallback(async () => {
    const currentSession = session;
    setSession(null);
    setStatus('anonymous');
    try {
      if (currentSession) await signOut(currentSession);
    } finally {
      await clearSession();
    }
  }, [session]);

  return {
    status,
    session,
    authenticate,
    register,
    logout,
    requestPasswordRecovery,
    updatePassword,
  };
}
