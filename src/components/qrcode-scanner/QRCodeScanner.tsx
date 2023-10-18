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
import QRCodeScannerNeedsAuthorization from './QRCodeScannerNeedsAuthorization';
import { useHardwareBack, useScanner } from '@/hooks';
import { deviceUtils } from '@/utils';
import { Box, Cover, Rows, Row } from '@/design-system';
import { useNavigation } from '@/navigation';
import { CameraMaskSvg } from '../svg/CameraMaskSvg';
import { IS_ANDROID, IS_IOS } from '@/env';
// @ts-ignore
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';

// Display.getRealMetrics

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

const androidSoftMenuHeight = getSoftMenuBarHeight();

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
  }, []);

  const { onScan } = useScanner(
    cameraState === CameraState.Scanning,
    hideCamera
  );

  // handle back button press on android
  useHardwareBack(hideCamera);

  const askForPermissions = useCallback(async () => {
    try {
      const permission = IS_IOS
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
    setTimeout(() => askForPermissions(), 200);
  }, [askForPermissions]);

  return (
    <>
      <Box
        position="absolute"
        width="full"
        height={{ custom: deviceHeight + androidSoftMenuHeight }}
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
            height={{ custom: deviceHeight + androidSoftMenuHeight }}
            position="absolute"
          />
        )}
        <Rows>
          <Row>
            <Box
              style={{ backgroundColor: 'black', opacity: 0.8 }}
              height="full"
            />
          </Row>
          <Row height="content">
            <Box alignItems="center">
              <CameraMaskSvg
                width={deviceWidth}
                height={deviceWidth - (IS_ANDROID ? 19 : 20)}
              />
            </Box>
            <Cover alignHorizontal="left">
              <Box
                height="full"
                width={{ custom: 10 }}
                style={{ backgroundColor: 'black', opacity: 0.8 }}
              />
            </Cover>
            <Cover alignHorizontal="right">
              <Box
                height="full"
                width={{ custom: 10 }}
                style={{ backgroundColor: 'black', opacity: 0.8 }}
              />
            </Cover>
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
              style={{ backgroundColor: 'black', opacity: 0.8 }}
              height="full"
            />
          </Row>
        </Rows>
      </Box>
    </>
  );
}
