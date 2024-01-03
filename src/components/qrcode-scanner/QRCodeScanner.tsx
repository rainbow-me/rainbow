import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useState } from 'react';
import { RNCamera } from 'react-native-camera';
import {
  check as checkForPermissions,
  PERMISSIONS,
  request as requestPermission,
  RESULTS,
} from 'react-native-permissions';
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { ErrorText } from '../text';
import QRCodeScannerNeedsAuthorization from './QRCodeScannerNeedsAuthorization';
import { useHardwareBack, useScanner } from '@/hooks';
import { deviceUtils } from '@/utils';
import { Box, Cover, Rows, Row } from '@/design-system';
import { CameraMaskSvg } from '../svg/CameraMaskSvg';
import { IS_ANDROID, IS_IOS } from '@/env';
import { useTheme } from '@/theme';
// @ts-ignore
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { useNavigation } from '@/navigation';

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

export default function QRCodeScanner({
  flashEnabled,
  setFlashEnabled,
}: {
  flashEnabled: boolean;
  setFlashEnabled: (value: boolean) => void;
}) {
  const { colors } = useTheme();
  const [cameraState, setCameraState] = useState(CameraState.Waiting);
  const isFocused = useIsFocused();
  const { setOptions } = useNavigation();

  const [enabled, setEnabled] = useState(ios);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    // We have to do this instead of `useIsFocused` because the
    // component does not unmount properly when navigating away
    // from the screen.
    setOptions({
      onWillDismiss: () => {
        setEnabled(false);
      },
    });
  }, [setOptions]);

  useEffect(() => {
    if (isFocused) {
      setEnabled(true);
    } else {
      setEnabled(false);
      setFlashEnabled(false);
      setIsCameraReady(false);
    }
  }, [isFocused, setFlashEnabled]);

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

  useFocusEffect(() => {
    setTimeout(() => askForPermissions(), 200);
  });

  const cameraStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isCameraReady ? 1 : 0, {
      duration: 225,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }),
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isCameraReady ? 0 : 1, {
      duration: 225,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }),
  }));

  return (
    <>
      <Box
        position="absolute"
        width="full"
        height={{ custom: deviceHeight + androidSoftMenuHeight }}
      >
        {enabled && (
          <Box as={Animated.View} style={cameraStyle}>
            <Box
              as={RNCamera}
              captureAudio={false}
              flashMode={
                flashEnabled
                  ? RNCamera.Constants.FlashMode.torch
                  : RNCamera.Constants.FlashMode.off
              }
              onBarCodeRead={onScan}
              onMountError={() => setCameraState(CameraState.Error)}
              onCameraReady={() => setIsCameraReady(true)}
              pendingAuthorizationView={undefined}
              width="full"
              height={{ custom: deviceHeight + androidSoftMenuHeight }}
              position="absolute"
            >
              <Animated.View
                style={[
                  overlayStyle,
                  {
                    backgroundColor: colors.trueBlack,
                    height: '100%',
                    width: '100%',
                  },
                ]}
              />
            </Box>
          </Box>
        )}
        {cameraState === CameraState.Error ||
        cameraState === CameraState.Unauthorized ? (
          <Cover alignHorizontal="center" alignVertical="center">
            {cameraState === CameraState.Error && (
              // @ts-expect-error – JS component
              <ErrorText error={lang.t('wallet.qr.error_mounting_camera')} />
            )}
            {cameraState === CameraState.Unauthorized && (
              <QRCodeScannerNeedsAuthorization onGetBack={askForPermissions} />
            )}
          </Cover>
        ) : (
          <Rows>
            <Row>
              <Box
                style={{ backgroundColor: 'black', opacity: 0.9 }}
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
                  style={{ backgroundColor: 'black', opacity: 0.9 }}
                />
              </Cover>
              <Cover alignHorizontal="right">
                <Box
                  height="full"
                  width={{ custom: 10 }}
                  style={{ backgroundColor: 'black', opacity: 0.9 }}
                />
              </Cover>
            </Row>
            <Row>
              <Box
                style={{ backgroundColor: 'black', opacity: 0.9 }}
                height="full"
              />
            </Row>
          </Rows>
        )}
      </Box>
    </>
  );
}
