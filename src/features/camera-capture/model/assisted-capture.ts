import type { CameraCapabilities } from './camera-capabilities.ts';

export type AssistedMeteringMode = 'AF' | 'AE';
export type AssistedFocusMode = 'center-metering' | 'automatic';
export type AssistedExposureMode = 'manual' | 'automatic-metering' | 'automatic';

export interface AssistedCaptureRecommendation {
  id: 'focus' | 'exposure' | 'stability';
  title: string;
  detail: string;
}

export interface AssistedCapturePlan {
  meteringModes: AssistedMeteringMode[];
  focusMode: AssistedFocusMode;
  exposureMode: AssistedExposureMode;
  exposureCompensationEv: number;
  iso: number | null;
  exposureTimeSeconds: number | null;
  recommendations: AssistedCaptureRecommendation[];
}

export interface AppliedCaptureParameters {
  focusMode: AssistedFocusMode;
  exposureMode: AssistedExposureMode;
  exposureCompensationEv: number;
  iso: number | 'automatic';
  exposureTimeSeconds: number | 'automatic';
  fallbacks: ('focus-metering' | 'manual-exposure' | 'exposure-compensation')[];
}

export interface AstroPhotoMetadata {
  capturedAt: string;
  device: {
    id: string;
    name: string;
  };
  parameters: AppliedCaptureParameters;
}

export interface AssistedCaptureController {
  meterCenter(modes: AssistedMeteringMode[]): Promise<void>;
  setExposureBias(value: number): Promise<void>;
  setManualExposure(exposureTimeSeconds: number, iso: number): Promise<void>;
}

const TARGET_EXPOSURE_COMPENSATION_EV = 0.7;
const TARGET_ISO = 800;
const TARGET_EXPOSURE_TIME_SECONDS = 1 / 8;

export function createAssistedCapturePlan(capabilities: CameraCapabilities): AssistedCapturePlan {
  const meteringModes: AssistedMeteringMode[] = [];
  if (capabilities.focus.meteringSupported) meteringModes.push('AF');
  if (capabilities.exposure.meteringSupported) meteringModes.push('AE');

  const manualExposureSupported =
    capabilities.exposure.lockingSupported &&
    hasSupportedRange(capabilities.iso) &&
    hasSupportedRange(capabilities.exposureTime);
  const exposureCompensationEv = supportedTarget(
    capabilities.exposureCompensation,
    TARGET_EXPOSURE_COMPENSATION_EV,
  );
  const iso = manualExposureSupported ? supportedTarget(capabilities.iso, TARGET_ISO) : null;
  const exposureTimeSeconds = manualExposureSupported
    ? supportedTarget(capabilities.exposureTime, TARGET_EXPOSURE_TIME_SECONDS)
    : null;
  const focusMode: AssistedFocusMode = capabilities.focus.meteringSupported
    ? 'center-metering'
    : 'automatic';
  const exposureMode: AssistedExposureMode = manualExposureSupported
    ? 'manual'
    : capabilities.exposure.meteringSupported
      ? 'automatic-metering'
      : 'automatic';

  return {
    meteringModes,
    focusMode,
    exposureMode,
    exposureCompensationEv,
    iso,
    exposureTimeSeconds,
    recommendations: buildRecommendations({
      focusMode,
      exposureMode,
      exposureCompensationEv,
      iso,
      exposureTimeSeconds,
    }),
  };
}

export async function applyAssistedCapturePlan(
  plan: AssistedCapturePlan,
  controller: AssistedCaptureController,
): Promise<AppliedCaptureParameters> {
  const fallbacks: AppliedCaptureParameters['fallbacks'] = [];
  let focusMode = plan.focusMode;
  let exposureMode = plan.exposureMode;
  let exposureCompensationEv = 0;
  let iso: number | 'automatic' = 'automatic';
  let exposureTimeSeconds: number | 'automatic' = 'automatic';

  if (plan.meteringModes.length > 0) {
    try {
      await controller.meterCenter(plan.meteringModes);
    } catch {
      if (plan.meteringModes.includes('AF')) {
        focusMode = 'automatic';
        fallbacks.push('focus-metering');
      }
      if (plan.meteringModes.includes('AE') && exposureMode === 'automatic-metering') {
        exposureMode = 'automatic';
      }
    }
  }

  if (plan.exposureMode === 'manual' && plan.iso !== null && plan.exposureTimeSeconds !== null) {
    try {
      await controller.setManualExposure(plan.exposureTimeSeconds, plan.iso);
      iso = plan.iso;
      exposureTimeSeconds = plan.exposureTimeSeconds;
    } catch {
      exposureMode = plan.meteringModes.includes('AE') ? 'automatic-metering' : 'automatic';
      fallbacks.push('manual-exposure');
    }
  }

  if (exposureMode !== 'manual' && plan.exposureCompensationEv !== 0) {
    try {
      await controller.setExposureBias(plan.exposureCompensationEv);
      exposureCompensationEv = plan.exposureCompensationEv;
    } catch {
      fallbacks.push('exposure-compensation');
    }
  }

  return {
    focusMode,
    exposureMode,
    exposureCompensationEv,
    iso,
    exposureTimeSeconds,
    fallbacks,
  };
}

export function createAstroPhotoMetadata(
  capabilities: CameraCapabilities,
  parameters: AppliedCaptureParameters,
  capturedAt: Date = new Date(),
): AstroPhotoMetadata {
  if (Number.isNaN(capturedAt.getTime())) throw new RangeError('Capture date must be valid');

  return {
    capturedAt: capturedAt.toISOString(),
    device: capabilities.device,
    parameters,
  };
}

export function describeAppliedCapture(parameters: AppliedCaptureParameters): string {
  if (parameters.exposureMode === 'manual') {
    return `Astrofoto capturada com ISO ${parameters.iso} e exposição de ${formatExposureTime(parameters.exposureTimeSeconds)}.`;
  }
  if (parameters.exposureCompensationEv !== 0) {
    return `Astrofoto capturada com exposição automática e ${formatSignedEv(parameters.exposureCompensationEv)} EV.`;
  }
  return 'Astrofoto capturada com os ajustes automáticos disponíveis.';
}

function supportedTarget(capability: CameraCapabilities['iso'], target: number): number {
  if (!hasSupportedRange(capability)) return 0;
  return Math.min(capability.maximum, Math.max(capability.minimum, target));
}

function hasSupportedRange(
  capability: CameraCapabilities['iso'],
): capability is CameraCapabilities['iso'] & { minimum: number; maximum: number } {
  return (
    capability.status === 'supported' &&
    capability.minimum !== null &&
    capability.maximum !== null &&
    Number.isFinite(capability.minimum) &&
    Number.isFinite(capability.maximum) &&
    capability.minimum <= capability.maximum
  );
}

function buildRecommendations({
  focusMode,
  exposureMode,
  exposureCompensationEv,
  iso,
  exposureTimeSeconds,
}: Omit<
  AssistedCapturePlan,
  'meteringModes' | 'recommendations'
>): AssistedCaptureRecommendation[] {
  const focus: AssistedCaptureRecommendation =
    focusMode === 'center-metering'
      ? {
          id: 'focus',
          title: 'Centralize o astro',
          detail: 'O foco será medido no centro imediatamente antes da foto.',
        }
      : {
          id: 'focus',
          title: 'Foco automático',
          detail: 'Este aparelho cuidará do foco usando o modo padrão da câmera.',
        };
  const exposure: AssistedCaptureRecommendation =
    exposureMode === 'manual' && iso !== null && exposureTimeSeconds !== null
      ? {
          id: 'exposure',
          title: `ISO ${Math.round(iso)} · ${formatExposureTime(exposureTimeSeconds)}`,
          detail: 'Os valores foram limitados ao intervalo seguro desta câmera.',
        }
      : exposureCompensationEv !== 0
        ? {
            id: 'exposure',
            title: `Exposição automática · ${formatSignedEv(exposureCompensationEv)} EV`,
            detail: 'O app aplicará apenas a compensação suportada pelo aparelho.',
          }
        : {
            id: 'exposure',
            title: 'Exposição automática',
            detail: 'ISO e tempo serão definidos com segurança pela câmera.',
          };

  return [
    focus,
    exposure,
    {
      id: 'stability',
      title: 'Mantenha o celular firme',
      detail: 'Apoie o aparelho e evite movimento durante o disparo.',
    },
  ];
}

function formatExposureTime(value: number | 'automatic'): string {
  if (value === 'automatic') return 'tempo automático';
  if (value >= 1) return `${Number(value.toFixed(2))} s`;
  return `1/${Math.round(1 / value)} s`;
}

function formatSignedEv(value: number): string {
  return `${value > 0 ? '+' : ''}${Number(value.toFixed(1))}`;
}
