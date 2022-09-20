import lang from 'i18n-js';
import React, { useCallback, useEffect, useState } from 'react';
import { RNCamera } from 'react-native-camera';
import { InteractionManager } from 'react-native';
import {
  check as checkForPermissions,
  PERMISSIONS,
  request as requestPermission,
  RESULTS,
} from 'react-native-permissions';
import { ErrorText } from '../text';
import ConnectedDapps from './ConnectedDapps';
import QRCodeScannerNeedsAuthorization from './QRCodeScannerNeedsAuthorization';
import { useHardwareBack, useScanner } from '@/hooks';
import { deviceUtils } from '@/utils';
import {
  AccentColorProvider,
  Box,
  Cover,
  Inset,
  Rows,
  Row,
  useForegroundColor,
} from '@/design-system';
import { useNavigation } from '@/navigation';
import { CameraMaskSvg } from '../svg/CameraMaskSvg';

const deviceWidth = deviceUtils.dimensions.width;
const deviceHeight = deviceUtils.dimensions.height;

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

export default function QRCodeScanner() {
  const [cameraState, setCameraState] = useState(CameraState.Waiting);
  const { goBack, setOptions } = useNavigation();

  const [enabled, setEnabled] = useState(ios);
  useEffect(() => {
    if (android) {
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          setEnabled(true);
        }, 200); // to stop fps drop on android
      });
    }

    // We have to do this instead of `useIsFocused` because the
    // component does not unmount properly when navigating away
    // from the screen.
    setOptions({
      onWillDismiss: () => {
        setEnabled(false);
      },
    });
  }, [setOptions]);

  const hideCamera = useCallback(() => {
    setEnabled(false);
    goBack();
  }, [goBack]);

  const { onScan } = useScanner(
    cameraState === CameraState.Scanning,
    hideCamera
  );

  // handle back button press on android
  useHardwareBack(hideCamera);

  const askForPermissions = useCallback(async () => {
    try {
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
      else if (res === RESULTS.UNAVAILABLE) {
        setCameraState(CameraState.Unauthorized);
      }
      // initialize the camera and celebrate
      else if (res === RESULTS.GRANTED) {
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

  const secondary80 = useForegroundColor('secondary80 (Deprecated)');

  return (
    <>
      <Box
        position="absolute"
        width="full"
        height={{ custom: deviceHeight }}
        marginTop={{ custom: -48 }}
      >
        {enabled && (
          <Box
            as={RNCamera}
            captureAudio={false}
            onBarCodeRead={onScan}
            onMountError={() => setCameraState(CameraState.Error)}
            pendingAuthorizationView={undefined}
            borderRadius={40}
            width="full"
            height={{ custom: deviceHeight }}
            position="absolute"
          />
        )}

        <Rows>
          <Row>
            <Box
              style={{ backgroundColor: 'black', opacity: 0.9 }}
              height="full"
            />
          </Row>
          <Row height="content">
            <CameraMaskSvg width={deviceWidth} height={deviceWidth} />
            <Cover alignHorizontal="center">
              <Inset top={{ custom: 14 }}>
                <AccentColorProvider color={secondary80}>
                  <Box
                    background="accent"
                    borderRadius={3}
                    height={{ custom: 5 }}
                    width={{ custom: 36 }}
                  />
                </AccentColorProvider>
              </Inset>
            </Cover>
            {ios && (
              <Cover>
                <Box
                  borderRadius={40}
                  width={{ custom: deviceWidth }}
                  height={{ custom: deviceWidth }}
                  style={{
                    // TODO: replace with new colors
                    borderColor: 'rgba(245, 248, 255, 0.12)',
                    borderStyle: 'solid',
                    borderWidth: 2,
                    zIndex: 2,
                  }}
                />
              </Cover>
            )}
            <Cover alignHorizontal="center" alignVertical="center">
              {cameraState === CameraState.Error && (
                // @ts-expect-error – JS component
                <ErrorText error={lang.t('wallet.qr.error_mounting_camera')} />
              )}
              {cameraState === CameraState.Unauthorized && (
                <QRCodeScannerNeedsAuthorization
                  onGetBack={askForPermissions}
                />
              )}
            </Cover>
          </Row>
          <Row>
            <Box
              style={{ backgroundColor: 'black', opacity: 0.9 }}
              height="full"
            />
          </Row>
        </Rows>
        <Cover alignHorizontal="center" alignVertical="bottom">
          <Inset bottom={{ custom: 54 }}>
            <ConnectedDapps />
          </Inset>
        </Cover>
      </Box>
    </>
  );
}
