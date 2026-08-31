import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { SupabaseClient } from '@supabase/supabase-js';

import { checkSupabaseConnectivity } from './connectivity.ts';

function clientReturning(result: unknown): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => result,
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

describe('checkSupabaseConnectivity', () => {
  it('returns the safe status exposed by Supabase', async () => {
    const result = await checkSupabaseConnectivity(
      clientReturning({ data: { status: 'available' }, error: null }),
    );

    assert.deepEqual(result, { status: 'available' });
  });

  it('does not expose provider details when connectivity fails', async () => {
    await assert.rejects(
      checkSupabaseConnectivity(
        clientReturning({ data: null, error: { message: 'sensitive upstream detail' } }),
      ),
      new Error('Não foi possível validar a conexão segura com o Supabase.'),
    );
  });
});
