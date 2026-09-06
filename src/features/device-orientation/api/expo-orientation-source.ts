import {
  Accelerometer,
  DeviceMotion,
  Gyroscope,
  Magnetometer,
  type AccelerometerMeasurement,
  type DeviceMotionMeasurement,
  type GyroscopeMeasurement,
  type MagnetometerMeasurement,
} from 'expo-sensors';

import type {
  DeviceOrientationSource,
  OrientationSample,
  SensorAvailability,
  Vector3,
} from '../model/orientation.types.ts';
import { isUsableRotation } from '../model/orientation.ts';

interface RemovableSubscription {
  remove(): void;
}

export class ExpoOrientationSource implements DeviceOrientationSource {
  async requestPermission(): Promise<boolean> {
    const permission = await DeviceMotion.requestPermissionsAsync();
    return permission.granted;
  }

  async getAvailability(): Promise<SensorAvailability> {
    const [deviceMotion, accelerometer, gyroscope, magnetometer] = await Promise.all([
      DeviceMotion.isAvailableAsync(),
      Accelerometer.isAvailableAsync(),
      Gyroscope.isAvailableAsync(),
      Magnetometer.isAvailableAsync(),
    ]);

    return { deviceMotion, accelerometer, gyroscope, magnetometer };
  }

  setUpdateInterval(intervalMs: number): void {
    DeviceMotion.setUpdateInterval(intervalMs);
    Accelerometer.setUpdateInterval(intervalMs);
    Gyroscope.setUpdateInterval(intervalMs);
    Magnetometer.setUpdateInterval(intervalMs);
  }

  subscribe(
    availability: SensorAvailability,
    listener: (sample: OrientationSample) => void,
  ): () => void {
    let acceleration: Vector3 | null = null;
    let rotationRate: Vector3 | null = null;
    let magneticField: Vector3 | null = null;
    const subscriptions: RemovableSubscription[] = [];

    if (availability.accelerometer) {
      subscriptions.push(
        Accelerometer.addListener((measurement: AccelerometerMeasurement) => {
          acceleration = vector(measurement);
        }),
      );
    }
    if (availability.gyroscope) {
      subscriptions.push(
        Gyroscope.addListener((measurement: GyroscopeMeasurement) => {
          rotationRate = vector(measurement);
        }),
      );
    }
    if (availability.magnetometer) {
      subscriptions.push(
        Magnetometer.addListener((measurement: MagnetometerMeasurement) => {
          magneticField = vector(measurement);
        }),
      );
    }

    subscriptions.push(
      DeviceMotion.addListener((measurement: DeviceMotionMeasurement) => {
        // Some Android devices can emit an initial DeviceMotion event without a
        // fused rotation. Skip that incomplete sample and wait for the next one.
        if (!isUsableRotation(measurement.rotation)) return;

        listener({
          alphaRadians: measurement.rotation.alpha,
          betaRadians: measurement.rotation.beta,
          gammaRadians: measurement.rotation.gamma,
          timestamp: measurement.rotation.timestamp,
          acceleration,
          rotationRate,
          magneticField,
        });
      }),
    );

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }
}

function vector(measurement: { x: number; y: number; z: number }): Vector3 {
  return { x: measurement.x, y: measurement.y, z: measurement.z };
}
