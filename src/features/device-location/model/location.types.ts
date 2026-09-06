export interface DeviceLocation {
  latitudeDegrees: number;
  longitudeDegrees: number;
  elevationMeters: number;
  accuracyMeters: number | null;
  timestamp: number;
}

export type DeviceLocationStatus =
  | 'requesting-permission'
  | 'locating'
  | 'active'
  | 'permission-denied'
  | 'services-disabled'
  | 'error';

export interface DeviceLocationState {
  status: DeviceLocationStatus;
  location: DeviceLocation | null;
  fallbackMessage: string | null;
}
