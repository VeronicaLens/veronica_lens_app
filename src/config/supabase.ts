import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';

import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';

import { getPublicEnvironment } from './env';

let cachedClient: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const environment = getPublicEnvironment();

  cachedClient = createClient(environment.supabaseUrl, environment.supabasePublishableKey, {
    auth: {
      storage: globalThis.localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  });

  return cachedClient;
}
