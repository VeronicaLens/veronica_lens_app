import {
  Camera,
  useCameraDevice,
  usePhotoOutput,
  type CameraRef,
} from 'react-native-vision-camera';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  CameraCaptureFailure,
  cameraFailureMessage,
  classifyCameraFailure,
} from '../model/camera-capture.ts';

export interface CapturedPhoto {
  uri: string;
}

export interface CameraCaptureHandle {
  capture(): Promise<CapturedPhoto>;
}

interface CameraCaptureViewProps {
  active: boolean;
  onError(message: string): void;
  onPreviewReady(): void;
}

export const CameraCaptureView = forwardRef<CameraCaptureHandle, CameraCaptureViewProps>(
  function CameraCaptureView({ active, onError, onPreviewReady }, forwardedRef) {
    const cameraRef = useRef<CameraRef>(null);
    const device = useCameraDevice('back');
    const photoOutput = usePhotoOutput({ quality: 0.92, qualityPrioritization: 'balanced' });
    const [previewReady, setPreviewReady] = useState(false);
    const onErrorRef = useRef(onError);

    useEffect(() => {
      onErrorRef.current = onError;
    }, [onError]);

    useEffect(() => {
      if (device) return;
      const timeout = setTimeout(
        () =>
          onErrorRef.current(cameraFailureMessage(new CameraCaptureFailure('device-unavailable'))),
        1500,
      );
      return () => clearTimeout(timeout);
    }, [device]);

    useImperativeHandle(
      forwardedRef,
      () => ({
        async capture() {
          if (!device) throw new CameraCaptureFailure('device-unavailable');
          if (!previewReady || !cameraRef.current?.controller) {
            throw new CameraCaptureFailure('not-ready');
          }

          try {
            const { filePath } = await photoOutput.capturePhotoToFile(
              { enableShutterSound: true, flashMode: 'off' },
              {},
            );
            return { uri: `file://${filePath}` };
          } catch (error) {
            throw new CameraCaptureFailure(classifyCameraFailure(error), error);
          }
        },
      }),
      [device, photoOutput, previewReady],
    );

    if (!device) return <View style={[StyleSheet.absoluteFill, styles.unavailable]} />;

    return (
      <Camera
        ref={cameraRef}
        device={device}
        enableNativeTapToFocusGesture
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
      />
    );
  },
);

const styles = StyleSheet.create({
  unavailable: { backgroundColor: '#080B14' },
});
