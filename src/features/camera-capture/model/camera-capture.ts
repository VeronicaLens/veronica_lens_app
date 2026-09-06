export type CameraFailureKind =
  'permission-denied' | 'device-unavailable' | 'camera-in-use' | 'not-ready' | 'capture-failed';

const messages: Record<CameraFailureKind, string> = {
  'permission-denied': 'A permissão da câmera não foi concedida.',
  'device-unavailable': 'Nenhuma câmera traseira está disponível neste aparelho.',
  'camera-in-use': 'A câmera está sendo usada por outro aplicativo. Feche-o e tente novamente.',
  'not-ready': 'A câmera ainda está sendo preparada. Aguarde um instante.',
  'capture-failed': 'Não foi possível capturar a foto. Tente novamente.',
};

export class CameraCaptureFailure extends Error {
  readonly kind: CameraFailureKind;
  readonly originalError: unknown;

  constructor(kind: CameraFailureKind, originalError?: unknown) {
    super(messages[kind]);
    this.name = 'CameraCaptureFailure';
    this.kind = kind;
    this.originalError = originalError;
  }
}

export function classifyCameraFailure(error: unknown): CameraFailureKind {
  if (error instanceof CameraCaptureFailure) return error.kind;

  const description = error instanceof Error ? error.message : String(error);
  const normalized = description.toLocaleLowerCase('en-US');

  if (normalized.includes('permission') || normalized.includes('authorized')) {
    return 'permission-denied';
  }
  if (normalized.includes('in use') || normalized.includes('another app')) {
    return 'camera-in-use';
  }
  if (
    normalized.includes('no camera') ||
    normalized.includes('device') ||
    normalized.includes('unavailable')
  ) {
    return 'device-unavailable';
  }
  if (normalized.includes('not ready') || normalized.includes('not running')) {
    return 'not-ready';
  }
  return 'capture-failed';
}

export function cameraFailureMessage(error: unknown): string {
  return messages[classifyCameraFailure(error)];
}
