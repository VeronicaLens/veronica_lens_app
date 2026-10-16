export { ExpoOrientationSource } from './api/expo-orientation-source.ts';
export {
  DEFAULT_ORIENTATION_INTERVAL_MS,
  DeviceOrientationService,
  initialDeviceOrientationState,
} from './model/device-orientation.service.ts';
export {
  isUsableRotation,
  normalizeHeading,
  normalizeSignedAngle,
  toDeviceOrientation,
} from './model/orientation.ts';
export type {
  DeviceOrientation,
  DeviceOrientationSource,
  DeviceOrientationState,
  OrientationSample,
  OrientationStatus,
  RotationMeasurement,
  SensorAvailability,
  Vector3,
} from './model/orientation.types.ts';
export { useDeviceOrientation } from './model/use-device-orientation.ts';
