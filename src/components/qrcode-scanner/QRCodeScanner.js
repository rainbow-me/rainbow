import React, {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { RNCamera } from 'react-native-camera';
import { useIsEmulator } from 'react-native-device-info';
import { Centered } from '../layout';
import { ErrorText } from '../text';
import ConnectedDapps from './ConnectedDapps';
import QRCodeScannerCrosshair from './QRCodeScannerCrosshair';
import QRCodeScannerNeedsAuthorization from './QRCodeScannerNeedsAuthorization';
import SimulatorFakeCameraImageSource from '@rainbow-me/assets/simulator-fake-camera-image.jpg';
import { useBooleanState, useScanner } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import styled from '@rainbow-me/styled';
import { position } from '@rainbow-me/styles';

const Camera = styled(RNCamera)({
  ...position.sizeAsObject('100%'),
  ...position.coverAsObject,
});

const CameraWrapper = styled(Centered)({
  ...position.sizeAsObject('100%'),
  backgroundColor: ({ theme: { colors } }) => colors.trueBlack || colors.black,
});

const Container = styled(Centered).attrs({
  direction: 'column',
})({
  ...position.coverAsObject,
  backgroundColor: ({ theme: { colors } }) => colors.black,
});

const ContentOverlay = styled(Centered)({
  ...position.coverAsObject,
  bottom: 230,
  flexDirection: 'column',
  top: ({ contentPositionTop }) => contentPositionTop || 0,
});

const EmulatorCameraFallback = styled(ImgixImage).attrs({
  source: SimulatorFakeCameraImageSource,
})({
  ...position.coverAsObject,
  ...position.sizeAsObject('100%'),
});

export default function QRCodeScanner({
  contentPositionTop,
  dsRef,
  enableCamera: isEnabledByFocus,
}) {
  const [cameraEnabledByBottomSheetPosition, setCameraEnabled] = useState(
    false
  );
  const cameraEnabled = isEnabledByFocus && cameraEnabledByBottomSheetPosition;
  const [error, showError] = useBooleanState();
  const [isInitialized, setInitialized] = useBooleanState();
  const { result: isEmulator } = useIsEmulator();
  const { isCameraAuthorized, onScan } = useScanner(cameraEnabled);

  const showErrorMessage = error && !isInitialized;
  const showCrosshair = !error && !showErrorMessage;
  const cameraRef = useRef();

  const onCrossMagicBorder = useCallback(
    below => {
      setCameraEnabled(below);
    },
    [setCameraEnabled]
  );
  useEffect(() => {
    dsRef.current?.addOnCrossMagicBorderListener(onCrossMagicBorder);
  }, [dsRef, onCrossMagicBorder]);
  useEffect(() => {
    if (ios || !isInitialized) {
      return;
    }
    if (cameraEnabled) {
      cameraRef.current?.resumePreview?.();
    } else {
      cameraRef.current?.pausePreview?.();
    }
  }, [cameraEnabled, isInitialized]);

  return (
    <Container>
      <CameraWrapper>
        {__DEV__ && cameraEnabled && isEmulator && <EmulatorCameraFallback />}
        {(cameraEnabled || android) && !isEmulator && (
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
        <ContentOverlay contentPositionTop={contentPositionTop}>
          {showErrorMessage && <ErrorText error="Error mounting camera" />}
          {showCrosshair && <QRCodeScannerCrosshair />}
          <ConnectedDapps />
        </ContentOverlay>
      ) : (
        <Fragment>
          <QRCodeScannerNeedsAuthorization />
          <ContentOverlay
            contentPositionTop={contentPositionTop + 350}
            pointerEvents="box-none"
          >
            <ConnectedDapps />
          </ContentOverlay>
        </Fragment>
      )}
    </Container>
  );
}
