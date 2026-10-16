import type { SupabaseConnectivity, SupabaseConnectivityResponse } from './generated/types.gen.ts';

import { apiRequest } from './client.ts';

type ConnectivityRequest = (path: string) => Promise<SupabaseConnectivityResponse>;

export async function checkSupabaseConnectivity(
  request: ConnectivityRequest = apiRequest,
): Promise<SupabaseConnectivity> {
  try {
    const response = await request('/connectivity/supabase');

    if (response.data?.provider !== 'supabase' || typeof response.data.status !== 'string') {
      throw new Error('INVALID_CONNECTIVITY_RESPONSE');
    }

    return response.data;
  } catch {
    throw new Error('Não foi possível validar a conexão segura com o Supabase.');
  }
}
