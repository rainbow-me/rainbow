import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useState } from 'react';
import { Camera, useCodeScanner } from 'react-native-vision-camera';
import Animated, { red } from 'react-native-reanimated';
import { ErrorText } from '../text';
import QRCodeScannerNeedsAuthorization from './QRCodeScannerNeedsAuthorization';
import { useAppState, useHardwareBack, useScanner } from '@/hooks';
import { deviceUtils } from '@/utils';
import { Box, Cover, Rows, Row } from '@/design-system';
import { CameraMaskSvg } from '../svg/CameraMaskSvg';
import { IS_ANDROID } from '@/env';
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
  const isFocused = useIsFocused();
  const { appState: currentAppState } = useAppState();
  const isActive =
    isFocused &&
    currentAppState === 'active' &&
    cameraState === CameraState.Scanning;

  useFocusEffect(
    React.useCallback(() => {
      setCameraState(CameraState.Scanning);
      return () => {
        setFlashEnabled(false);
        setCameraState(CameraState.Waiting);
        console.log(
          'useFocus cleanup ran, cameraState set to:',
          CameraState.Waiting
        );
      };
    }, [setCameraState, setFlashEnabled])
  );

  useEffect(() => {
    console.log('Camera State changed:', cameraState);
  }, [cameraState]);

  const devices = Camera.getAvailableCameraDevices();
  const device = devices.find(d => d.position === 'back');
  const customHeightValue = deviceHeight + androidSoftMenuHeight;

  const hideCamera = useCallback(() => {
    setCameraState(CameraState.Waiting);
  }, [setCameraState]);

  const { onScan } = useScanner(
    cameraState === CameraState.Scanning,
    hideCamera
  );

  useHardwareBack(hideCamera);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: codes => {
      if (codes[0].value) {
        onScan({ data: codes[0].value });
      }
    },
  });

  const cameraUI = (
    <>
      {!device ? (
        <ErrorText
          color="red"
          error={lang.t('wallet.qr.error_mounting_camera')}
        />
      ) : (
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
            />
          </Box>
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
        </Box>
      )}
    </>
  );

  return (
    <>
      {console.log('Render, cameraState is:', cameraState)}
      {cameraState === CameraState.Scanning ? cameraUI : null}
      {cameraState === CameraState.Error && (
        <ErrorText
          color={red}
          error={lang.t('wallet.qr.error_mounting_camera')}
        />
      )}
      {cameraState === CameraState.Unauthorized && (
        <Box
          position="absolute"
          width="full"
          height={{ custom: customHeightValue }}
          alignItems="center"
          justifyContent="center"
        >
          <QRCodeScannerNeedsAuthorization onGetBack={askForPermissions} />
        </Box>
      )}
    </>
  );
};
