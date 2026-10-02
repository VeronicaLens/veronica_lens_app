import {
  Camera,
  VisionCamera,
  useCameraDevice,
  usePhotoOutput,
  type CameraRef,
} from 'react-native-vision-camera';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import {
  CameraCaptureFailure,
  cameraFailureMessage,
  classifyCameraFailure,
} from '../model/camera-capture.ts';
import { detectCameraCapabilities, type CameraCapabilities } from '../model/camera-capabilities.ts';
import {
  applyAssistedCapturePlan,
  createAssistedCapturePlan,
  createAstroPhotoMetadata,
  type AppliedCaptureParameters,
  type AssistedCaptureSettings,
  type AstroPhotoMetadata,
} from '../model/assisted-capture.ts';

export interface CapturedPhoto {
  uri: string;
  metadata: AstroPhotoMetadata;
}

export interface CameraCaptureHandle {
  capture(): Promise<CapturedPhoto>;
}

export interface CameraZoomRange {
  minZoom: number;
  maxZoom: number;
}

interface CameraCaptureViewProps {
  active: boolean;
  assistedCaptureEnabled: boolean;
  assistedSettings: AssistedCaptureSettings;
  zoom: number;
  onCapabilitiesChange?(capabilities: CameraCapabilities | null): void;
  onError(message: string): void;
  onPreviewReady(): void;
  onZoomRangeChange?(range: CameraZoomRange | null): void;
}

export const CameraCaptureView = forwardRef<CameraCaptureHandle, CameraCaptureViewProps>(
  function CameraCaptureView(
    {
      active,
      assistedCaptureEnabled,
      assistedSettings,
      zoom,
      onCapabilitiesChange,
      onError,
      onPreviewReady,
      onZoomRangeChange,
    },
    forwardedRef,
  ) {
    const cameraRef = useRef<CameraRef>(null);
    const device = useCameraDevice('back');
    const photoOutput = usePhotoOutput({ quality: 0.92, qualityPrioritization: 'balanced' });
    const [previewReady, setPreviewReady] = useState(false);
    const onCapabilitiesChangeRef = useRef(onCapabilitiesChange);
    const onErrorRef = useRef(onError);
    const onZoomRangeChangeRef = useRef(onZoomRangeChange);

    useEffect(() => {
      onCapabilitiesChangeRef.current = onCapabilitiesChange;
    }, [onCapabilitiesChange]);

    useEffect(() => {
      onErrorRef.current = onError;
    }, [onError]);

    useEffect(() => {
      onZoomRangeChangeRef.current = onZoomRangeChange;
    }, [onZoomRangeChange]);

    useEffect(() => {
      if (device) return;
      const timeout = setTimeout(
        () =>
          onErrorRef.current(cameraFailureMessage(new CameraCaptureFailure('device-unavailable'))),
        1500,
      );
      return () => clearTimeout(timeout);
    }, [device]);

    useEffect(() => {
      if (!device) {
        onCapabilitiesChangeRef.current?.(null);
        onZoomRangeChangeRef.current?.(null);
        return;
      }

      const controller = previewReady ? cameraRef.current?.controller : undefined;
      onCapabilitiesChangeRef.current?.(
        detectCameraCapabilities(device, controller, Platform.OS !== 'android'),
      );
      onZoomRangeChangeRef.current?.({ minZoom: device.minZoom, maxZoom: device.maxZoom });
    }, [device, previewReady]);

    useImperativeHandle(
      forwardedRef,
      () => ({
        async capture() {
          if (!device) throw new CameraCaptureFailure('device-unavailable');
          if (!previewReady || !cameraRef.current?.controller) {
            throw new CameraCaptureFailure('not-ready');
          }

          try {
            const controller = cameraRef.current.controller;
            const capabilities = detectCameraCapabilities(
              device,
              controller,
              Platform.OS !== 'android',
            );
            const parameters: AppliedCaptureParameters = assistedCaptureEnabled
              ? await applyAssistedCapturePlan(
                  createAssistedCapturePlan(capabilities, assistedSettings),
                  {
                    meterCenter: async (modes) => {
                      const point = VisionCamera.createNormalizedMeteringPoint(0.5, 0.5);
                      await controller.focusTo(point, {
                        modes,
                        responsiveness: 'snappy',
                        adaptiveness: 'continuous',
                        autoResetAfter: 5,
                      });
                    },
                    setExposureBias: (value) => controller.setExposureBias(value),
                    setManualExposure: (exposureTimeSeconds, iso) =>
                      controller.setExposureLocked(exposureTimeSeconds, iso),
                  },
                )
              : {
                  focusMode: 'automatic',
                  exposureMode: 'automatic',
                  exposureCompensationEv: 0,
                  iso: 'automatic',
                  exposureTimeSeconds: 'automatic',
                  fallbacks: [],
                };
            const { filePath } = await photoOutput.capturePhotoToFile(
              { enableShutterSound: true, flashMode: 'off' },
              {},
            );
            return {
              uri: `file://${filePath}`,
              metadata: createAstroPhotoMetadata(capabilities, parameters),
            };
          } catch (error) {
            throw new CameraCaptureFailure(classifyCameraFailure(error), error);
          }
        },
      }),
      [assistedCaptureEnabled, assistedSettings, device, photoOutput, previewReady],
    );

    if (!device) return <View style={[StyleSheet.absoluteFill, styles.unavailable]} />;

    return (
      <Camera
        ref={cameraRef}
        device={device}
        enableNativeTapToFocusGesture={device.supportsFocusMetering}
        isActive={active}
        onError={(error) => onError(cameraFailureMessage(error))}
        onPreviewStarted={() => {
          setPreviewReady(true);
          onPreviewReady();
        }}
        onPreviewStopped={() => setPreviewReady(false)}
        outputs={[photoOutput]}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
        zoom={zoom}
      />
    );
  },
);

const styles = StyleSheet.create({
  unavailable: { backgroundColor: '#080B14' },
});
