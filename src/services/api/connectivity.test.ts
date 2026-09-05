import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { checkSupabaseConnectivity } from './connectivity.ts';

describe('checkSupabaseConnectivity', () => {
  it('returns the safe status exposed by the backend', async () => {
    const result = await checkSupabaseConnectivity(async (path) => {
      assert.equal(path, '/connectivity/supabase');
      return { data: { provider: 'supabase', status: 'available' } };
    });

    assert.deepEqual(result, { provider: 'supabase', status: 'available' });
  });

  it('does not expose backend or provider details when connectivity fails', async () => {
    await assert.rejects(
      checkSupabaseConnectivity(async () => {
        throw new Error('sensitive upstream detail');
      }),
      new Error('Não foi possível validar a conexão segura com o Supabase.'),
    );
  });

  it('rejects an invalid backend response', async () => {
    await assert.rejects(
      checkSupabaseConnectivity(async () => ({
        data: { provider: 'supabase', status: 42 as unknown as string },
      })),
      new Error('Não foi possível validar a conexão segura com o Supabase.'),
    );
  });
});
