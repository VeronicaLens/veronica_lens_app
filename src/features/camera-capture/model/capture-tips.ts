import type { AssistedCapturePlan } from './assisted-capture.ts';
import type { CameraCapabilities, CameraNumericCapability } from './camera-capabilities.ts';

export type CaptureProfileId = 'deep-sky' | 'moon' | 'landscape';
export type CaptureTargetType = 'moon' | 'planet' | 'star' | 'constellation';

export interface CaptureProfile {
  id: CaptureProfileId;
  label: string;
  description: string;
  iso: number;
  exposureTimeSeconds: number;
  exposureCompensationEv: number;
}

export const captureProfiles: readonly CaptureProfile[] = [
  {
    id: 'deep-sky',
    label: 'Céu profundo',
    description: 'Exposição longa para estrelas e nebulosas',
    iso: 1600,
    exposureTimeSeconds: 1 / 4,
    exposureCompensationEv: 1,
  },
  {
    id: 'moon',
    label: 'Lua e planetas',
    description: 'Exposição curta para objetos brilhantes',
    iso: 200,
    exposureTimeSeconds: 1 / 125,
    exposureCompensationEv: -1.5,
  },
  {
    id: 'landscape',
    label: 'Paisagem noturna',
    description: 'Equilíbrio entre céu e primeiro plano',
    iso: 800,
    exposureTimeSeconds: 1 / 2,
    exposureCompensationEv: 0.7,
  },
];

export type CaptureTipAction =
  | { kind: 'profile'; profileId: CaptureProfileId }
  | { kind: 'exposure'; iso: number; exposureTimeSeconds: number }
  | { kind: 'exposure-compensation'; value: number }
  | { kind: 'zoom'; zoom: number }
  | { kind: 'level' };

export type CaptureTipSeverity = 'warning' | 'suggestion' | 'info';
export type CaptureTipTopic =
  'profile' | 'exposure' | 'zoom' | 'stability' | 'framing' | 'level' | 'focus';

export interface CaptureTip {
  id: string;
  topic: CaptureTipTopic;
  severity: CaptureTipSeverity;
  title: string;
  detail: string;
  action?: { label: string; value: CaptureTipAction };
}

export interface CaptureTipInput {
  profileId: CaptureProfileId;
  target: { name: string; type: CaptureTargetType } | null;
  plan: AssistedCapturePlan | null;
  capabilities: CameraCapabilities | null;
  zoom: number;
  zoomRange: { minZoom: number; maxZoom: number } | null;
  orientation: {
    pitchDegrees: number;
    rollDegrees: number;
    rotationRate: { x: number; y: number; z: number } | null;
  } | null;
}

const MOVING_ROTATION_RADIANS_PER_SECOND = 0.12;
const HANDHELD_LIMIT_SECONDS = 1 / 30;
const TILT_TOLERANCE_DEGREES = 3;
const severityOrder: Record<CaptureTipSeverity, number> = { warning: 0, suggestion: 1, info: 2 };

export function findCaptureProfile(id: CaptureProfileId): CaptureProfile {
  return (
    captureProfiles.find((profile) => profile.id === id) ?? (captureProfiles[0] as CaptureProfile)
  );
}

/**
 * Builds contextual photography advice ordered by urgency. Every suggested value is
 * limited to what the current camera reports as supported.
 */
export function buildCaptureTips(input: CaptureTipInput): CaptureTip[] {
  const profile = findCaptureProfile(input.profileId);
  const tips = [
    framingTip(input),
    profileTip(input, profile),
    exposureTip(input, profile),
    stabilityTip(input),
    zoomTip(input, profile),
    levelTip(input, profile),
    focusTip(input),
  ].filter((tip): tip is CaptureTip => tip !== null);

  return tips.sort((left, right) => severityOrder[left.severity] - severityOrder[right.severity]);
}

function framingTip({ orientation, profileId }: CaptureTipInput): CaptureTip | null {
  if (!orientation || profileId === 'landscape' || orientation.pitchDegrees >= 5) return null;
  return {
    id: 'framing-sky',
    topic: 'framing',
    severity: 'warning',
    title: 'Aponte a câmera para o céu',
    detail: 'O visor está voltado para o horizonte ou para baixo. Incline o celular para cima.',
  };
}

function profileTip({ target }: CaptureTipInput, profile: CaptureProfile): CaptureTip | null {
  if (!target) return null;
  const bright = target.type === 'moon' || target.type === 'planet';
  if (bright && profile.id !== 'moon') {
    return {
      id: 'profile-bright',
      topic: 'profile',
      severity: 'suggestion',
      title: `Use o perfil Lua e planetas para ${target.name}`,
      detail: 'Objetos brilhantes pedem exposição curta e ISO baixo para não estourar.',
      action: { label: 'Trocar perfil', value: { kind: 'profile', profileId: 'moon' } },
    };
  }
  if (!bright && profile.id === 'moon') {
    return {
      id: 'profile-faint',
      topic: 'profile',
      severity: 'suggestion',
      title: `Use o perfil Céu profundo para ${target.name}`,
      detail: 'Estrelas precisam de mais luz: exposição longa e ISO alto.',
      action: { label: 'Trocar perfil', value: { kind: 'profile', profileId: 'deep-sky' } },
    };
  }
  return null;
}

function exposureTip(
  { plan, capabilities }: CaptureTipInput,
  profile: CaptureProfile,
): CaptureTip | null {
  if (!plan || !capabilities) return null;

  if (plan.exposureMode === 'manual' && plan.iso !== null && plan.exposureTimeSeconds !== null) {
    const targetIso = clampToCapability(profile.iso, capabilities.iso);
    const targetTime = clampToCapability(profile.exposureTimeSeconds, capabilities.exposureTime);
    const current = `ISO ${Math.round(plan.iso)} · ${formatExposureTime(plan.exposureTimeSeconds)}`;
    const target = `ISO ${Math.round(targetIso)} · ${formatExposureTime(targetTime)}`;
    const action = {
      label: 'Aplicar',
      value: { kind: 'exposure', iso: targetIso, exposureTimeSeconds: targetTime } as const,
    };

    if (profile.id === 'moon' && plan.exposureTimeSeconds > HANDHELD_LIMIT_SECONDS) {
      return {
        id: 'exposure-overexposed',
        topic: 'exposure',
        severity: 'warning',
        title: 'A Lua vai sair estourada',
        detail: `${current} deixa entrar luz demais. Recomendo ${target}.`,
        action,
      };
    }
    if (profile.id !== 'moon' && plan.exposureTimeSeconds < HANDHELD_LIMIT_SECONDS) {
      return {
        id: 'exposure-underexposed',
        topic: 'exposure',
        severity: 'warning',
        title: 'A foto vai sair escura',
        detail: `${current} é rápido demais para o céu noturno. Recomendo ${target}.`,
        action,
      };
    }
    if (
      stopsBetween(plan.iso, targetIso) >= 1 ||
      stopsBetween(plan.exposureTimeSeconds, targetTime) >= 1
    ) {
      return {
        id: 'exposure-adjust',
        topic: 'exposure',
        severity: 'suggestion',
        title: `Recomendado: ${target}`,
        detail: `${exposureReason(profile.id)} Atual: ${current}.`,
        action,
      };
    }
    return {
      id: 'exposure-ok',
      topic: 'exposure',
      severity: 'info',
      title: `Exposição pronta: ${current}`,
      detail: exposureReason(profile.id),
    };
  }

  if (capabilities.exposureCompensation.status === 'supported') {
    const targetEv = clampToCapability(
      profile.exposureCompensationEv,
      capabilities.exposureCompensation,
    );
    if (Math.abs(plan.exposureCompensationEv - targetEv) >= 0.5) {
      return {
        id: 'exposure-compensation',
        topic: 'exposure',
        severity: 'suggestion',
        title: `Ajuste a exposição para ${formatSignedEv(targetEv)}`,
        detail:
          profile.id === 'moon'
            ? 'Escurecer a cena preserva os detalhes da superfície lunar.'
            : 'Clarear a cena ajuda a revelar estrelas mais fracas.',
        action: { label: 'Aplicar', value: { kind: 'exposure-compensation', value: targetEv } },
      };
    }
  }

  return {
    id: 'exposure-automatic',
    topic: 'exposure',
    severity: 'info',
    title: 'Exposição automática neste aparelho',
    detail: 'ISO e tempo manuais não estão disponíveis. Toque no astro para medir a luz nele.',
  };
}

function stabilityTip({ orientation, plan, profileId }: CaptureTipInput): CaptureTip | null {
  const exposure = plan?.exposureTimeSeconds ?? (profileId === 'moon' ? null : 1 / 4);
  if (exposure === null || exposure < HANDHELD_LIMIT_SECONDS) return null;

  const rate = orientation?.rotationRate;
  const moving =
    rate !== null &&
    rate !== undefined &&
    Math.hypot(rate.x, rate.y, rate.z) > MOVING_ROTATION_RADIANS_PER_SECOND;

  return moving
    ? {
        id: 'stability-moving',
        topic: 'stability',
        severity: 'warning',
        title: 'Celular em movimento',
        detail: `Com ${formatExposureTime(exposure)} qualquer tremida borra as estrelas. Apoie o aparelho ou use um tripé.`,
      }
    : {
        id: 'stability-support',
        topic: 'stability',
        severity: 'info',
        title: 'Use apoio ou tripé',
        detail: `Exposições de ${formatExposureTime(exposure)} ficam mais nítidas com o celular parado.`,
      };
}

function zoomTip({ zoom, zoomRange }: CaptureTipInput, profile: CaptureProfile): CaptureTip | null {
  if (!zoomRange) return null;
  if (profile.id === 'moon' && zoom < 2 && zoomRange.maxZoom >= 2) {
    const target = Math.min(3, zoomRange.maxZoom);
    return {
      id: 'zoom-in',
      topic: 'zoom',
      severity: 'suggestion',
      title: `Aproxime para ${formatZoom(target)}`,
      detail: 'Mais zoom revela crateras da Lua e o disco dos planetas.',
      action: { label: `Usar ${formatZoom(target)}`, value: { kind: 'zoom', zoom: target } },
    };
  }
  if (profile.id !== 'moon' && zoom > 1.01) {
    const target = Math.max(1, zoomRange.minZoom);
    return {
      id: 'zoom-out',
      topic: 'zoom',
      severity: 'suggestion',
      title: `Volte para ${formatZoom(target)}`,
      detail: 'Em exposições longas, o zoom amplia o ruído e o rastro das estrelas.',
      action: { label: `Usar ${formatZoom(target)}`, value: { kind: 'zoom', zoom: target } },
    };
  }
  if (profile.id === 'landscape' && zoomRange.minZoom < 0.95 && zoom > zoomRange.minZoom + 0.01) {
    return {
      id: 'zoom-wide',
      topic: 'zoom',
      severity: 'info',
      title: `Experimente ${formatZoom(zoomRange.minZoom)}`,
      detail: 'A lente grande-angular inclui mais céu e paisagem na mesma foto.',
      action: {
        label: `Usar ${formatZoom(zoomRange.minZoom)}`,
        value: { kind: 'zoom', zoom: zoomRange.minZoom },
      },
    };
  }
  return null;
}

function levelTip({ orientation }: CaptureTipInput, profile: CaptureProfile): CaptureTip | null {
  if (!orientation || profile.id !== 'landscape') return null;
  const tilt = Math.round(orientation.rollDegrees);
  if (Math.abs(orientation.rollDegrees) <= TILT_TOLERANCE_DEGREES) return null;
  return {
    id: 'level-tilted',
    topic: 'level',
    severity: 'suggestion',
    title: `Horizonte inclinado ${Math.abs(tilt)}°`,
    detail: `Gire o celular para a ${tilt > 0 ? 'esquerda' : 'direita'} até nivelar a paisagem.`,
    action: { label: 'Mostrar nível', value: { kind: 'level' } },
  };
}

function focusTip({ capabilities, target }: CaptureTipInput): CaptureTip | null {
  if (!capabilities) return null;
  return {
    id: 'focus',
    topic: 'focus',
    severity: 'info',
    title: target ? `Foque em ${target.name}` : 'Foque no ponto mais brilhante',
    detail: capabilities.focus.meteringSupported
      ? 'Toque nele no visor antes de disparar para ajustar foco e medição.'
      : 'Mantenha o astro no centro: o foco automático usa essa região.',
  };
}

function exposureReason(profileId: CaptureProfileId): string {
  switch (profileId) {
    case 'moon':
      return 'Exposição curta preserva os detalhes de objetos brilhantes.';
    case 'deep-sky':
      return 'Exposição longa e ISO alto captam estrelas mais fracas.';
    case 'landscape':
      return 'Equilibra o brilho do céu e o primeiro plano com pouco ruído.';
  }
}

function clampToCapability(value: number, capability: CameraNumericCapability): number {
  if (
    capability.status !== 'supported' ||
    capability.minimum === null ||
    capability.maximum === null
  ) {
    return value;
  }
  return Math.min(capability.maximum, Math.max(capability.minimum, value));
}

function stopsBetween(current: number, target: number): number {
  return current > 0 && target > 0 ? Math.abs(Math.log2(current / target)) : 0;
}

function formatExposureTime(seconds: number): string {
  if (seconds >= 1) return `${Number(seconds.toFixed(1)).toLocaleString('pt-BR')} s`;
  return `1/${Math.round(1 / seconds)} s`;
}

function formatSignedEv(value: number): string {
  const formatted = Number(value.toFixed(1)).toLocaleString('pt-BR');
  return `${value > 0 ? '+' : ''}${formatted} EV`;
}

function formatZoom(value: number): string {
  return `${Number(value.toFixed(1)).toLocaleString('pt-BR')}x`;
}
