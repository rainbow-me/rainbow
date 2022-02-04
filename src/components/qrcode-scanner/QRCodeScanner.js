import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RNCamera } from 'react-native-camera';
import { useIsEmulator } from 'react-native-device-info';
import {
  check as checkForPermissions,
  PERMISSIONS,
  request as requestPermission,
  RESULTS,
} from 'react-native-permissions';
import { Centered } from '../layout';
import { ErrorText } from '../text';
import ConnectedDapps from './ConnectedDapps';
import QRCodeScannerCrosshair from './QRCodeScannerCrosshair';
import QRCodeScannerNeedsAuthorization from './QRCodeScannerNeedsAuthorization';
import SimulatorFakeCameraImageSource from '@rainbow-me/assets/simulator-fake-camera-image.jpg';
import { useAsyncEffect, useHardwareBack, useScanner } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';
import { deviceUtils } from '@rainbow-me/utils';

const Camera = styled(RNCamera)({
  ...position.coverAsObject,
  // just to move it to the top a bit
  // so the part of the video feed isn't covered by the bottom sheet
  height: deviceUtils.dimensions.height - 200,
  width: '100%',
});

const CameraWrapper = styled(Centered)(({ theme }) => ({
  backgroundColor: theme.colors.trueBlack || theme.colors.black,
  width: '100%',
}));

const Container = styled.View(({ theme }) => ({
  ...position.coverAsObject,
  backgroundColor: theme.colors.stackBackground,
}));

const ContentOverlay = styled(Centered)(({ contentPositionTop }) => ({
  ...position.coverAsObject,
  bottom: 200,
  flexDirection: 'column',
  top: contentPositionTop || 0,
}));

const EmulatorCameraFallback = styled(ImgixImage).attrs({
  source: SimulatorFakeCameraImageSource,
})({
  ...position.coverAsObject,
  height: '100%',
  width: '100%',
});

const CameraState = {
  // unexpected mount error
  Error: 'error',
  // properly working camera, ready to scan
  Scanning: 'scanning',
  // we should ask user for permission
  Unauthorized: 'unauthorized',
  // ready to go
  Waiting: 'waiting',
};

export default function QRCodeScanner({
  contentPositionTop,
  dsRef,
  enableCamera: isEnabledByFocus,
}) {
  const cameraRef = useRef();
  const { result: isEmulator } = useIsEmulator();
  const [cameraEnabledByBottomSheetPosition, setCameraEnabled] = useState(
    false
  );
  const [cameraState, setCameraState] = useState(CameraState.Waiting);
  const shouldInitializeCamera =
    isEnabledByFocus && cameraEnabledByBottomSheetPosition;

  const cameraEnabled =
    cameraState === CameraState.Scanning && shouldInitializeCamera;

  const hideCamera = useCallback(() => {
    dsRef.current?.jumpToLong();
  }, [dsRef]);

  const { onScan } = useScanner(cameraEnabled, hideCamera);

  // handle back button press on android
  useHardwareBack(hideCamera, !shouldInitializeCamera);

  const onCrossMagicBorder = useCallback(
    below => {
      setCameraEnabled(below);
    },
    [setCameraEnabled]
  );
  useEffect(() => {
    dsRef.current?.addOnCrossMagicBorderListener(onCrossMagicBorder);
  }, [dsRef, onCrossMagicBorder]);

  const askForPermissions = useCallback(async () => {
    if (!shouldInitializeCamera) {
      setCameraState(CameraState.Waiting);

      return;
    }

    const permission = ios
      ? PERMISSIONS.IOS.CAMERA
      : PERMISSIONS.ANDROID.CAMERA;

    const res = await checkForPermissions(permission);

    // we should ask permission natively with the native alert thing
    if (res === RESULTS.DENIED || res === RESULTS.BLOCKED) {
      const askResult = await requestPermission(permission);

      if (askResult !== RESULTS.GRANTED) {
        setCameraState(CameraState.Unauthorized);
      } else {
        setCameraState(CameraState.Scanning);
      }
    }
    // we should ask for permission through the UI
    else if (res === RESULTS.BLOCKED || res === RESULTS.UNAVAILABLE) {
      setCameraState(CameraState.Unauthorized);
    }
    // initialize the camera and celebrate
    else if (res === RESULTS.GRANTED) {
      setCameraState(CameraState.Scanning);
    }
  }, [shouldInitializeCamera]);

  useAsyncEffect(askForPermissions, [shouldInitializeCamera]);

  if (!shouldInitializeCamera) {
    return null;
  }

  if (__DEV__ && isEmulator) {
    return (
      <Container>
        <CameraWrapper>
          <EmulatorCameraFallback />
        </CameraWrapper>
      </Container>
    );
  }

  return (
    <Container>
      {cameraState === CameraState.Scanning && (
        <>
          <Camera
            captureAudio={false}
            onBarCodeRead={onScan}
            onMountError={() => setCameraState(CameraState.Error)}
            pendingAuthorizationView={null}
            ref={cameraRef}
          />

          <ContentOverlay contentPositionTop={contentPositionTop}>
            <QRCodeScannerCrosshair />

            <ConnectedDapps />
          </ContentOverlay>
        </>
      )}

      {cameraState === CameraState.Waiting && (
        <ContentOverlay contentPositionTop={contentPositionTop}>
          <QRCodeScannerCrosshair />
        </ContentOverlay>
      )}

      {cameraState === CameraState.Error && (
        <ContentOverlay contentPositionTop={contentPositionTop}>
          <ErrorText error="Error mounting camera" />

          <ConnectedDapps />
        </ContentOverlay>
      )}

      {cameraState === CameraState.Unauthorized && (
        <>
          <QRCodeScannerNeedsAuthorization onGetBack={askForPermissions} />
          <ContentOverlay
            contentPositionTop={contentPositionTop + 350}
            pointerEvents="box-none"
          >
            <ConnectedDapps />
          </ContentOverlay>
        </>
      )}
    </Container>
  );
}
