import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { Camera, CodeScanner, useCameraDevice } from 'react-native-vision-camera';
import Animated from 'react-native-reanimated';
import { ErrorText } from '../text';
import QRCodeScannerNeedsAuthorization from './QRCodeScannerNeedsAuthorization';
import { deviceUtils } from '@/utils';
import { Box, Cover, Rows, Row } from '@/design-system';
import { CameraMaskSvg } from '../svg/CameraMaskSvg';
import { IS_ANDROID } from '@/env';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { useFocusEffect } from '@react-navigation/native';

const deviceWidth = deviceUtils.dimensions.width;
const deviceHeight = deviceUtils.dimensions.height;

const androidSoftMenuHeight = getSoftMenuBarHeight();

interface QRCodeScannerProps {
  flashEnabled?: boolean;
  isActive: boolean;
  codeScanner: CodeScanner;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ flashEnabled, isActive, codeScanner, hasPermission, requestPermission }) => {
  const device = useCameraDevice('back');
  const customHeightValue = deviceHeight + androidSoftMenuHeight;

  useFocusEffect(
    useCallback(() => {
      requestPermission();
    }, [requestPermission])
  );

  const cameraUI = (
    <>
      {!device ? (
        <ErrorText color="red" error={lang.t('wallet.qr.error_mounting_camera')} />
      ) : (
        <Box position="absolute" width="full" height={{ custom: customHeightValue }}>
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
              onError={() => requestPermission}
            />
          </Box>
          <Rows>
            <Row>
              <Box style={{ backgroundColor: 'black', opacity: 0.9 }} height="full" />
            </Row>
            <Row height="content">
              <Box alignItems="center">
                <CameraMaskSvg width={deviceWidth} height={deviceWidth - (IS_ANDROID ? 19 : 20)} />
              </Box>
              <Cover alignHorizontal="left">
                <Box height="full" width={{ custom: 10 }} style={{ backgroundColor: 'black', opacity: 0.9 }} />
              </Cover>
              <Cover alignHorizontal="right">
                <Box height="full" width={{ custom: 10 }} style={{ backgroundColor: 'black', opacity: 0.9 }} />
              </Cover>
            </Row>
            <Row>
              <Box style={{ backgroundColor: 'black', opacity: 0.9 }} height="full" />
            </Row>
          </Rows>
        </Box>
      )}
    </>
  );

  return (
    <>
      {hasPermission ? (
        cameraUI
      ) : (
        <Box position="absolute" width="full" height={{ custom: customHeightValue }} alignItems="center" justifyContent="center">
          <QRCodeScannerNeedsAuthorization onGetBack={requestPermission} />
        </Box>
      )}
    </>
  );
};
