export type CameraCapabilityStatus = 'supported' | 'pending' | 'unsupported';
export type CameraNumericUnit = 'ev' | 'iso' | 'seconds';

export interface CameraNumericCapability {
  status: CameraCapabilityStatus;
  unit: CameraNumericUnit;
  minimum: number | null;
  maximum: number | null;
  fallback: 'automatic-exposure';
}

export interface CameraCapabilities {
  device: {
    id: string;
    name: string;
  };
  focus: {
    meteringSupported: boolean;
    lockingSupported: boolean;
    fallback: 'tap-to-focus' | 'system-default';
  };
  exposure: {
    meteringSupported: boolean;
    lockingSupported: boolean;
    fallback: 'exposure-compensation' | 'automatic-metering' | 'system-default';
  };
  exposureCompensation: CameraNumericCapability;
  iso: CameraNumericCapability;
  exposureTime: CameraNumericCapability;
}

/** Minimum subset of native device information needed by capability detection. */
export interface CameraCapabilityDevice {
  id: string;
  localizedName: string;
  supportsFocusMetering: boolean;
  supportsFocusLocking: boolean;
  supportsExposureMetering: boolean;
  supportsExposureLocking: boolean;
  supportsExposureBias: boolean;
  minExposureBias: number;
  maxExposureBias: number;
}

/** Values that only become available after VisionCamera creates its controller. */
export interface CameraCapabilityController {
  minExposureDuration: number;
  maxExposureDuration: number;
  minISO: number;
  maxISO: number;
}

/**
 * Converts VisionCamera hardware data into a stable, UI-oriented contract.
 * Unsupported controls always include the safe automatic fallback the UI must use.
 */
export function detectCameraCapabilities(
  device: CameraCapabilityDevice,
  controller?: CameraCapabilityController,
): CameraCapabilities {
  const exposureCompensation = numericCapability({
    declaredSupported: device.supportsExposureBias,
    minimum: device.minExposureBias,
    maximum: device.maxExposureBias,
    unit: 'ev',
  });
  const manualExposurePending = device.supportsExposureLocking && !controller;

  return {
    device: { id: device.id, name: device.localizedName },
    focus: {
      meteringSupported: device.supportsFocusMetering,
      lockingSupported: device.supportsFocusLocking,
      fallback: device.supportsFocusMetering ? 'tap-to-focus' : 'system-default',
    },
    exposure: {
      meteringSupported: device.supportsExposureMetering,
      lockingSupported: device.supportsExposureLocking,
      fallback: exposureFallback(device),
    },
    exposureCompensation,
    iso: manualNumericCapability(
      device.supportsExposureLocking,
      manualExposurePending,
      controller?.minISO,
      controller?.maxISO,
      'iso',
    ),
    exposureTime: manualNumericCapability(
      device.supportsExposureLocking,
      manualExposurePending,
      controller?.minExposureDuration,
      controller?.maxExposureDuration,
      'seconds',
    ),
  };
}

function exposureFallback(
  device: CameraCapabilityDevice,
): CameraCapabilities['exposure']['fallback'] {
  if (device.supportsExposureBias) return 'exposure-compensation';
  if (device.supportsExposureMetering) return 'automatic-metering';
  return 'system-default';
}

function manualNumericCapability(
  declaredSupported: boolean,
  pending: boolean,
  minimum: number | undefined,
  maximum: number | undefined,
  unit: CameraNumericUnit,
): CameraNumericCapability {
  if (pending) return pendingCapability(unit);
  return numericCapability({ declaredSupported, minimum, maximum, unit, requirePositive: true });
}

function numericCapability({
  declaredSupported,
  minimum,
  maximum,
  unit,
  requirePositive = false,
}: {
  declaredSupported: boolean;
  minimum: number | undefined;
  maximum: number | undefined;
  unit: CameraNumericUnit;
  requirePositive?: boolean;
}): CameraNumericCapability {
  const validRange =
    declaredSupported &&
    typeof minimum === 'number' &&
    typeof maximum === 'number' &&
    Number.isFinite(minimum) &&
    Number.isFinite(maximum) &&
    minimum <= maximum &&
    (!requirePositive || minimum > 0);

  return validRange
    ? { status: 'supported', unit, minimum, maximum, fallback: 'automatic-exposure' }
    : unsupportedCapability(unit);
}

function pendingCapability(unit: CameraNumericUnit): CameraNumericCapability {
  return {
    status: 'pending',
    unit,
    minimum: null,
    maximum: null,
    fallback: 'automatic-exposure',
  };
}

function unsupportedCapability(unit: CameraNumericUnit): CameraNumericCapability {
  return {
    status: 'unsupported',
    unit,
    minimum: null,
    maximum: null,
    fallback: 'automatic-exposure',
  };
}
