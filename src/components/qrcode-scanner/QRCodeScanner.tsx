import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useEffect } from 'react';
import { Camera, useCodeScanner } from 'react-native-vision-camera';
import Animated from 'react-native-reanimated';
import { ErrorText } from '../text';
import QRCodeScannerNeedsAuthorization from './QRCodeScannerNeedsAuthorization';
import { useAppState } from '@/hooks';
import { deviceUtils } from '@/utils';
import { Box, Cover, Rows, Row } from '@/design-system';
import { CameraMaskSvg } from '../svg/CameraMaskSvg';
import { IS_ANDROID } from '@/env';
// @ts-ignore
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { CameraState, useCameraPermission } from './useCameraPermissions';
import { colors } from '@/styles';
import { Alert } from 'react-native';

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
  const isFocused = useIsFocused();
  const { appState: currentAppState } = useAppState();
  const isActive = isFocused && currentAppState === 'active';

  useEffect(() => {
    if (!isFocused) {
      setFlashEnabled(false);
    }
  }, [isFocused, setFlashEnabled]);

  const devices = Camera.getAvailableCameraDevices();
  const device = devices.find(d => d.position === 'back');
  const customHeightValue = deviceHeight + androidSoftMenuHeight;

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: codes => {
      Alert.alert(
        'Scan Complete',
        `Scanned ${codes.length} codes!`,
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
        { cancelable: false }
      );
    },
  });

  useFocusEffect(() => {
    setTimeout(() => askForPermissions(), 200);
  });

  if (!device) {
    return <QRCodeScannerNeedsAuthorization onGetBack={askForPermissions} />;
  }
  return (
    <>
      <Box
        position="absolute"
        width="full"
        height={{ custom: customHeightValue }}
      >
        <Box as={Animated.View} style={{ opacity: 1 }}>
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
            video={false}
            photo={false}
            onError={() => setCameraState(CameraState.Error)}
          >
            <Animated.View
              style={[
                {
                  opacity: 0,
                  backgroundColor: colors.trueBlack,
                  height: '100%',
                  width: '100%',
                },
              ]}
            />
          </Camera>
        </Box>
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
