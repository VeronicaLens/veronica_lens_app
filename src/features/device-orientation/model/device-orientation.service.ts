import { toDeviceOrientation } from './orientation.ts';
import type {
  DeviceOrientationSource,
  DeviceOrientationState,
  SensorAvailability,
} from './orientation.types.ts';

export const DEFAULT_ORIENTATION_INTERVAL_MS = 50;

export const initialDeviceOrientationState: DeviceOrientationState = {
  status: 'idle',
  quality: null,
  orientation: null,
  availability: null,
  fallbackMessage: null,
};

export class DeviceOrientationService {
  private readonly source: DeviceOrientationSource;
  private readonly updateIntervalMs: number;

  constructor(source: DeviceOrientationSource, updateIntervalMs = DEFAULT_ORIENTATION_INTERVAL_MS) {
    this.source = source;
    this.updateIntervalMs = updateIntervalMs;
  }

  async start(listener: (state: DeviceOrientationState) => void): Promise<() => void> {
    listener({
      ...initialDeviceOrientationState,
      status: 'requesting-permission',
    });

    try {
      if (!(await this.source.requestPermission())) {
        listener({
          ...initialDeviceOrientationState,
          status: 'permission-denied',
          fallbackMessage:
            'Permita o acesso aos sensores nas configurações para alinhar o guia ao céu.',
        });
        return () => undefined;
      }

      listener({
        ...initialDeviceOrientationState,
        status: 'checking-availability',
      });
      const availability = await this.source.getAvailability();

      if (!availability.deviceMotion) {
        listener({
          ...initialDeviceOrientationState,
          status: 'unavailable',
          availability,
          fallbackMessage:
            'Orientação automática indisponível. Use o modo manual para explorar o céu.',
        });
        return () => undefined;
      }

      const quality = hasAllRawSensors(availability) ? 'full' : 'degraded';
      const fallbackMessage =
        quality === 'degraded'
          ? 'Alguns sensores não estão disponíveis. O alinhamento pode ter precisão reduzida.'
          : null;

      this.source.setUpdateInterval(this.updateIntervalMs);
      listener({
        status: 'listening',
        quality,
        orientation: null,
        availability,
        fallbackMessage,
      });

      return this.source.subscribe(availability, (sample) => {
        listener({
          status: 'active',
          quality,
          orientation: toDeviceOrientation(sample),
          availability,
          fallbackMessage,
        });
      });
    } catch {
      listener({
        ...initialDeviceOrientationState,
        status: 'error',
        fallbackMessage:
          'Não foi possível iniciar a orientação automática. Use o modo manual e tente novamente.',
      });
      return () => undefined;
    }
  }
}

function hasAllRawSensors(availability: SensorAvailability): boolean {
  return availability.accelerometer && availability.gyroscope && availability.magnetometer;
}
