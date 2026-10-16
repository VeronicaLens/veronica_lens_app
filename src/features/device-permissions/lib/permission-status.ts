export type PermissionState = 'granted' | 'undetermined' | 'denied';

export type PermissionAction = 'request' | 'settings';

export interface PermissionSnapshot {
  state: PermissionState;
  canAskAgain: boolean;
}

export interface PermissionPresentation {
  label: string;
  action: PermissionAction;
  actionLabel: string;
}

/** Permissions that can still be asked for in-app use the system dialog; the others need Settings. */
export function describePermission(snapshot: PermissionSnapshot): PermissionPresentation {
  if (snapshot.state === 'granted') {
    return { label: 'Permitido', action: 'settings', actionLabel: 'Gerenciar' };
  }
  if (snapshot.canAskAgain) {
    return {
      label: snapshot.state === 'denied' ? 'Negado' : 'Não solicitado',
      action: 'request',
      actionLabel: 'Permitir',
    };
  }
  return { label: 'Bloqueado', action: 'settings', actionLabel: 'Abrir ajustes' };
}

export function toPermissionSnapshot(response: {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}): PermissionSnapshot {
  if (response.granted) return { state: 'granted', canAskAgain: response.canAskAgain };
  return {
    state: response.status === 'undetermined' ? 'undetermined' : 'denied',
    canAskAgain: response.canAskAgain,
  };
}
