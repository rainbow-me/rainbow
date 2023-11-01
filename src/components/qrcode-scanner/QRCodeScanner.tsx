import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useState } from 'react';
// import { RNCamera } from 'react-native-camera';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { ErrorText } from '../text';
import QRCodeScannerNeedsAuthorization from './QRCodeScannerNeedsAuthorization';
import { useAppState, useHardwareBack } from '@/hooks';
import { deviceUtils } from '@/utils';
import { Box, Cover, Rows, Row } from '@/design-system';
import { CameraMaskSvg } from '../svg/CameraMaskSvg';
import { IS_ANDROID, IS_IOS } from '@/env';
import { useTheme } from '@/theme';
// @ts-ignore
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { CameraState, useCameraPermission } from './useCameraPermissions';

// Display.getRealMetrics

const deviceWidth = deviceUtils.dimensions.width;
const deviceHeight = deviceUtils.dimensions.height;

const androidSoftMenuHeight = getSoftMenuBarHeight();

interface QRCodeScannerProps {
  flashEnabled?: boolean;
  setFlashEnabled: (value: boolean) => void;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  flashEnabled,
  setFlashEnabled,
}) => {
  const {
    cameraState,
    setCameraState,
    askForPermissions,
  } = useCameraPermission();
  // const { colors } = useTheme();
  const isFocused = useIsFocused();
  const { appState: currentAppState } = useAppState();
  const isActive = isFocused && currentAppState === 'active';
  const [enabled, setEnabled] = useState(IS_IOS);
  const [isCameraReady, setIsCameraReady] = useState(false);

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

  useHardwareBack(hideCamera);

  const cameraStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isCameraReady ? 1 : 0, {
      duration: 225,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }),
  }));

  const device = useCameraDevice('back');
  const customHeightValue = deviceHeight + androidSoftMenuHeight;

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: codes => {
      console.log(`Scanned ${codes.length} codes!`);
    },
  });

  if (device == null)
    return <QRCodeScannerNeedsAuthorization onGetBack={askForPermissions} />;
  return (
    <>
      <Box
        position="absolute"
        width="full"
        height={{ custom: customHeightValue }}
      >
        <Box as={Animated.View} style={cameraStyle}>
          <Camera
            style={{
              height: customHeightValue,
              width: '100%',
              position: 'absolute',
            }}
            device={device}
            isActive={isActive}
            codeScanner={codeScanner}
            torch={!flashEnabled ? 'off' : 'on'}
            audio={false}
            onError={() => setCameraState(CameraState.Error)}
          />
        </Box>
        )
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
};
