export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface SensorAvailability {
  deviceMotion: boolean;
  accelerometer: boolean;
  gyroscope: boolean;
  magnetometer: boolean;
}

export interface OrientationSample {
  alphaRadians: number;
  betaRadians: number;
  gammaRadians: number;
  timestamp: number;
  acceleration: Vector3 | null;
  rotationRate: Vector3 | null;
  magneticField: Vector3 | null;
}

export interface DeviceOrientation {
  headingDegrees: number;
  pitchDegrees: number;
  rollDegrees: number;
  timestamp: number;
  acceleration: Vector3 | null;
  rotationRate: Vector3 | null;
  magneticField: Vector3 | null;
}

export type OrientationStatus =
  | 'idle'
  | 'requesting-permission'
  | 'checking-availability'
  | 'listening'
  | 'active'
  | 'permission-denied'
  | 'unavailable'
  | 'error';

export interface DeviceOrientationState {
  status: OrientationStatus;
  quality: 'full' | 'degraded' | null;
  orientation: DeviceOrientation | null;
  availability: SensorAvailability | null;
  fallbackMessage: string | null;
}

export interface DeviceOrientationSource {
  requestPermission(): Promise<boolean>;
  getAvailability(): Promise<SensorAvailability>;
  setUpdateInterval(intervalMs: number): void;
  subscribe(
    availability: SensorAvailability,
    listener: (sample: OrientationSample) => void,
  ): () => void;
}
