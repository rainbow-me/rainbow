import React, { useCallback } from 'react';
import { Platform } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import Animated from 'react-native-reanimated';
import { Camera, useCameraDevice, type CodeScanner } from 'react-native-vision-camera';

import { Box, Cover, Row, Rows } from '@/design-system';
import * as i18n from '@/languages';
import deviceUtils, { NAVIGATION_BAR_HEIGHT } from '@/utils/deviceUtils';

import { CameraMaskSvg } from '../svg/CameraMaskSvg';
import { ErrorText } from '../text';
import QRCodeScannerNeedsAuthorization from './QRCodeScannerNeedsAuthorization';

const deviceWidth = deviceUtils.dimensions.width;
const deviceHeight = deviceUtils.dimensions.height;

interface QRCodeScannerProps {
  flashEnabled?: boolean;
  isActive: boolean;
  codeScanner: CodeScanner;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ flashEnabled, isActive, codeScanner, hasPermission, requestPermission }) => {
  const device = useCameraDevice('back');
  const customHeightValue = deviceHeight + NAVIGATION_BAR_HEIGHT;

  useFocusEffect(
    useCallback(() => {
      requestPermission();
    }, [requestPermission])
  );

  const cameraUI = (
    <>
      {!device ? (
        <ErrorText color="red" error={i18n.t(i18n.l.wallet.qr.error_mounting_camera)} />
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
              onError={requestPermission}
            />
          </Box>
          <Rows>
            <Row>
              <Box style={{ backgroundColor: 'black', opacity: 0.9 }} height="full" />
            </Row>
            <Row height="content">
              <Box alignItems="center">
                <CameraMaskSvg width={deviceWidth} height={deviceWidth - (Platform.OS === 'android' ? 19 : 20)} />
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
