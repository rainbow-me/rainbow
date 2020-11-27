import React, { useEffect, useRef } from 'react';
import { RNCamera } from 'react-native-camera';
import { useIsEmulator } from 'react-native-device-info';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components/primitives';
import { Centered } from '../layout';
import { ErrorText } from '../text';
import QRCodeScannerCrosshair from './QRCodeScannerCrosshair';
import QRCodeScannerNeedsAuthorization from './QRCodeScannerNeedsAuthorization';
import SimulatorFakeCameraImageSource from '@rainbow-me/assets/simulator-fake-camera-image.jpg';
import { useBooleanState, useScanner } from '@rainbow-me/hooks';
import { colors, position } from '@rainbow-me/styles';

const Camera = styled(RNCamera)`
  ${position.cover};
  ${position.size('100%')};
`;

const CameraWrapper = styled(Centered)`
  ${position.size('100%')};
`;

const Container = styled(Centered).attrs({
  direction: 'column',
})`
  ${position.cover};
  background-color: ${colors.black};
`;

const ContentOverlay = styled(Centered)`
  ${position.cover};
  bottom: ${({ contentPositionBottom }) => contentPositionBottom || 0};
  top: ${({ contentPositionTop }) => contentPositionTop || 0};
`;

const EmulatorCameraFallback = styled(FastImage).attrs({
  source: SimulatorFakeCameraImageSource,
})`
  ${position.cover};
  ${position.size('100%')};
`;

export default function QRCodeScanner({
  contentPositionBottom,
  contentPositionTop,
  enableCamera,
}) {
  const [error, showError] = useBooleanState();
  const [isInitialized, setInitialized] = useBooleanState();
  const { result: isEmulator } = useIsEmulator();
  const { isCameraAuthorized, onScan } = useScanner(enableCamera);

  const showErrorMessage = error && !isInitialized;
  const showCrosshair = !error && !showErrorMessage;
  const cameraRef = useRef();
  useEffect(() => {
    if (ios || !isInitialized) {
      return;
    }
    if (enableCamera) {
      cameraRef.current?.resumePreview?.();
    } else {
      cameraRef.current?.pausePreview?.();
    }
  }, [enableCamera, isInitialized]);

  return (
    <Container>
      <CameraWrapper>
        {enableCamera && isEmulator && <EmulatorCameraFallback />}
        {(enableCamera || android) && !isEmulator && (
          <Camera
            captureAudio={false}
            notAuthorizedView={QRCodeScannerNeedsAuthorization}
            onBarCodeRead={onScan}
            onCameraReady={setInitialized}
            onMountError={showError}
            pendingAuthorizationView={null}
            ref={cameraRef}
          />
        )}
      </CameraWrapper>
      {isCameraAuthorized ? (
        <ContentOverlay
          contentPositionBottom={contentPositionBottom}
          contentPositionTop={contentPositionTop}
        >
          {showErrorMessage && <ErrorText error="Error mounting camera" />}
          {showCrosshair && <QRCodeScannerCrosshair />}
        </ContentOverlay>
      ) : (
        <QRCodeScannerNeedsAuthorization />
      )}
    </Container>
  );
}
