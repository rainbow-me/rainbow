import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  check as checkForPermissions,
  PERMISSIONS,
  request as requestPermission,
  RESULTS,
} from 'react-native-permissions';

export enum CameraState {
  // unexpected mount error
  Error = 'error',
  // properly working camera, ready to scan
  Scanning = 'scanning',
  // we should ask user for permission
  Unauthorized = 'unauthorized',
  // ready to go
  Waiting = 'waiting',
}

export function useCameraPermission() {
  const [cameraState, setCameraState] = useState<CameraState>(
    CameraState.Scanning
  );

  const askForPermissions = useCallback(async () => {
    try {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.CAMERA
          : PERMISSIONS.ANDROID.CAMERA;

      const res = await checkForPermissions(permission);

      if (res === RESULTS.DENIED || res === RESULTS.BLOCKED) {
        const askResult = await requestPermission(permission);

        if (askResult !== RESULTS.GRANTED) {
          setCameraState(CameraState.Unauthorized);
        } else {
          setCameraState(CameraState.Scanning);
        }
      } else if (res === RESULTS.UNAVAILABLE) {
        setCameraState(CameraState.Unauthorized);
      } else if (res === RESULTS.GRANTED) {
        setCameraState(CameraState.Scanning);
      }
    } catch (err) {
      setCameraState(CameraState.Error);
      throw err;
    }
  }, []);

  useEffect(() => {
    askForPermissions();
  }, [askForPermissions]);

  return {
    cameraState,
    setCameraState,
    askForPermissions,
  };
}
