import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { describePermission, toPermissionSnapshot } from './permission-status.ts';

describe('describePermission', () => {
  it('offers management in Settings once granted', () => {
    assert.deepEqual(describePermission({ state: 'granted', canAskAgain: true }), {
      label: 'Permitido',
      action: 'settings',
      actionLabel: 'Gerenciar',
    });
  });

  it('asks in-app while the system still allows the request', () => {
    assert.equal(
      describePermission({ state: 'undetermined', canAskAgain: true }).action,
      'request',
    );
    assert.equal(describePermission({ state: 'denied', canAskAgain: true }).label, 'Negado');
  });

  it('sends the user to Settings when the system blocks further requests', () => {
    assert.deepEqual(describePermission({ state: 'denied', canAskAgain: false }), {
      label: 'Bloqueado',
      action: 'settings',
      actionLabel: 'Abrir ajustes',
    });
  });
});

describe('toPermissionSnapshot', () => {
  it('maps Expo permission responses', () => {
    assert.deepEqual(
      toPermissionSnapshot({ granted: true, canAskAgain: true, status: 'granted' }),
      {
        state: 'granted',
        canAskAgain: true,
      },
    );
    assert.deepEqual(
      toPermissionSnapshot({ granted: false, canAskAgain: true, status: 'undetermined' }),
      { state: 'undetermined', canAskAgain: true },
    );
    assert.deepEqual(
      toPermissionSnapshot({ granted: false, canAskAgain: false, status: 'denied' }),
      {
        state: 'denied',
        canAskAgain: false,
      },
    );
  });
});
