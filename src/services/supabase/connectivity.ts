import type { SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConnectivity {
  status: string;
}

export async function checkSupabaseConnectivity(
  client: SupabaseClient,
): Promise<SupabaseConnectivity> {
  const { data, error } = await client
    .from('system_status')
    .select('status')
    .eq('id', 'supabase')
    .single();

  if (error) {
    throw new Error('Não foi possível validar a conexão segura com o Supabase.');
  }

  if (!data || typeof data.status !== 'string') {
    throw new Error('O Supabase respondeu sem um estado de conectividade válido.');
  }

  return { status: data.status };
}
