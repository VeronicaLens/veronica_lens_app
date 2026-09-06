import { useCameraPermission } from 'react-native-vision-camera';

export function useCameraAccess() {
  const permission = useCameraPermission();

  return {
    status: permission.status,
    granted: permission.hasPermission,
    canRequest: permission.canRequestPermission,
    request: permission.requestPermission,
  };
}
