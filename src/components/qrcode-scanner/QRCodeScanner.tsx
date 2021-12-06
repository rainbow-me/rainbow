import React, {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { RNCamera } from 'react-native-camera';
import { useIsEmulator } from 'react-native-device-info';
import styled from 'styled-components';
import { Centered } from '../layout';
import { ErrorText } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ConnectedDapps' was resolved to '/Users/... Remove this comment to see the full error message
import ConnectedDapps from './ConnectedDapps';
// @ts-expect-error ts-migrate(6142) FIXME: Module './QRCodeScannerCrosshair' was resolved to ... Remove this comment to see the full error message
import QRCodeScannerCrosshair from './QRCodeScannerCrosshair';
// @ts-expect-error ts-migrate(6142) FIXME: Module './QRCodeScannerNeedsAuthorization' was res... Remove this comment to see the full error message
import QRCodeScannerNeedsAuthorization from './QRCodeScannerNeedsAuthorization';
import SimulatorFakeCameraImageSource from '@rainbow-me/assets/simulator-fake-camera-image.jpg';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useBooleanState, useScanner } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const Camera = styled(RNCamera)`
  ${position.cover};
  ${position.size('100%')};
`;

const CameraWrapper = styled(Centered)`
  ${position.size('100%')};
  background-color: ${({ theme: { colors } }) =>
    colors.trueBlack || colors.black};
`;

const Container = styled(Centered).attrs({
  direction: 'column',
})`
  ${position.cover};
  background-color: ${({ theme: { colors } }) => colors.black};
`;

const ContentOverlay = styled(Centered)`
  ${position.cover};
  bottom: 230;
  flex-direction: column;
  top: ${({ contentPositionTop }) => contentPositionTop || 0};
`;

const EmulatorCameraFallback = styled(ImgixImage).attrs({
  source: SimulatorFakeCameraImageSource,
})`
  ${position.cover};
  ${position.size('100%')};
`;

export default function QRCodeScanner({
  contentPositionTop,
  dsRef,
  enableCamera: isEnabledByFocus,
}: any) {
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
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
    if (ios || !isInitialized) {
      return;
    }
    if (cameraEnabled) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'resumePreview' does not exist on type 'n... Remove this comment to see the full error message
      cameraRef.current?.resumePreview?.();
    } else {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'pausePreview' does not exist on type 'ne... Remove this comment to see the full error message
      cameraRef.current?.pausePreview?.();
    }
  }, [cameraEnabled, isInitialized]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <CameraWrapper>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        {cameraEnabled && isEmulator && <EmulatorCameraFallback />}
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        {(cameraEnabled || android) && !isEmulator && (
          // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
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
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ContentOverlay contentPositionTop={contentPositionTop}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          {showErrorMessage && <ErrorText error="Error mounting camera" />}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          {showCrosshair && <QRCodeScannerCrosshair />}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ConnectedDapps />
        </ContentOverlay>
      ) : (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Fragment>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <QRCodeScannerNeedsAuthorization />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ContentOverlay
            contentPositionTop={contentPositionTop + 350}
            pointerEvents="box-none"
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <ConnectedDapps />
          </ContentOverlay>
        </Fragment>
      )}
    </Container>
  );
}
