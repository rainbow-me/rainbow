import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  check as checkForPermissions,
  PERMISSIONS,
  request as requestPermission,
  RESULTS,
} from 'react-native-permissions';

export enum CameraState {
  Error = 'error',
  Scanning = 'scanning',
  Unauthorized = 'unauthorized',
  Waiting = 'waiting',
}

const cameraPermission =
  Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;

export function useCameraPermission() {
  const [cameraState, setCameraState] = useState<CameraState>(
    CameraState.Waiting
  );
  const [hasPermission, setHasPermission] = useState(false);

  const checkPermissions = useCallback(async () => {
    return await checkForPermissions(cameraPermission);
  }, []);

  const askForPermissions = useCallback(async () => {
    try {
      const res = await checkPermissions();

      if (res === RESULTS.DENIED || res === RESULTS.BLOCKED) {
        const askResult = await requestPermission(cameraPermission);
        setHasPermission(askResult === RESULTS.GRANTED);
      } else if (res === RESULTS.UNAVAILABLE) {
        setHasPermission(false);
      } else if (res === RESULTS.GRANTED) {
        setHasPermission(true);
      }
    } catch (err) {
      console.error('Error checking permissions:', err);
      setHasPermission(false);
    }
  }, [checkPermissions]);

  useEffect(() => {
    // Effect to handle the camera state based on permission
    if (hasPermission) {
      setCameraState(CameraState.Scanning);
    } else {
      setCameraState(CameraState.Unauthorized);
    }
  }, [hasPermission]);

  return {
    cameraState,
    setCameraState,
    askForPermissions,
  };
}
