import i18n from '@/languages';
import React, { useCallback } from 'react';
import { Camera, CodeScanner, useCameraDevice } from 'react-native-vision-camera';
import Animated from 'react-native-reanimated';
import { ErrorText } from '../text';
import QRCodeScannerNeedsAuthorization from './QRCodeScannerNeedsAuthorization';
import { deviceUtils } from '@/utils';
import { Box, Cover, Rows, Row } from '@/design-system';
import { CameraMaskSvg } from '../svg/CameraMaskSvg';
import { IS_ANDROID } from '@/env';
import { useFocusEffect } from '@react-navigation/native';
import { NAVIGATION_BAR_HEIGHT } from '@/utils/deviceUtils';

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
        <ErrorText color="red" error={i18n.wallet.qr.error_mounting_camera()} />
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
