import type { Session } from '../../../shared/api/index.ts';

const SESSION_KEY = 'veronica_lens_session_v1';

export interface SessionStorage {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

const secureStoreStorage: SessionStorage = {
  async getItemAsync(key) {
    return (await import('expo-secure-store')).getItemAsync(key);
  },
  async setItemAsync(key, value) {
    const secureStore = await import('expo-secure-store');
    await secureStore.setItemAsync(key, value, {
      keychainAccessible: secureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async deleteItemAsync(key) {
    await (await import('expo-secure-store')).deleteItemAsync(key);
  },
};

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Session>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.accessToken === 'string' &&
    typeof candidate.refreshToken === 'string' &&
    candidate.tokenType === 'bearer' &&
    typeof candidate.expiresAt === 'string' &&
    typeof candidate.user?.id === 'string'
  );
}

export async function loadSession(
  storage: SessionStorage = secureStoreStorage,
): Promise<Session | null> {
  const serialized = await storage.getItemAsync(SESSION_KEY);
  if (!serialized) return null;

  try {
    const value: unknown = JSON.parse(serialized);
    return isSession(value) ? value : null;
  } catch {
    return null;
  }
}

export async function saveSession(
  session: Session,
  storage: SessionStorage = secureStoreStorage,
): Promise<void> {
  await storage.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession(storage: SessionStorage = secureStoreStorage): Promise<void> {
  await storage.deleteItemAsync(SESSION_KEY);
}
