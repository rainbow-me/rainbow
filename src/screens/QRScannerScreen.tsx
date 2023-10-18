import React from 'react';
import { View } from 'react-native';
import { useIsEmulator } from 'react-native-device-info';
import { Header } from '../components/header';
import { Centered } from '../components/layout';
import {
  CameraDimmer,
  EmulatorPasteUriButton,
  QRCodeScanner,
} from '../components/qrcode-scanner';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { Navbar } from '@/components/navbar/Navbar';
import { Box, ColorModeProvider } from '@/design-system';
import { SheetHandle } from '@/components/sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Background = styled(View)({
  backgroundColor: 'black',
  height: '100%',
  position: 'absolute',
  width: '100%',
});

const ScannerContainer = styled(Centered).attrs({
  direction: 'column',
})({
  ...position.sizeAsObject('100%'),
  overflow: 'hidden',
});

const ScannerHeader = styled(Header).attrs({
  justify: 'space-between',
  testID: 'scanner-header',
})({
  position: 'absolute',
  top: 48,
});

export default function QRScannerScreen() {
  const { result: isEmulator } = useIsEmulator();

  const { top: topInset } = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none">
      <ColorModeProvider value="darkTinted">
        <Box
          position="absolute"
          top={{ custom: topInset - 8 }}
          width="full"
          style={{ zIndex: 1 }}
        >
          <Box alignItems="center" paddingTop="8px" height={{ custom: 16 }}>
            <SheetHandle color="rgba(245, 248, 255, 0.4)" showBlur={false} />
          </Box>
          <Navbar hasStatusBarInset={false} title="Scan to Connect" />
        </Box>
        <ScannerContainer>
          <Background />
          <CameraDimmer cameraVisible={true}>
            {android && (
              <ScannerHeader>
                <EmulatorPasteUriButton />
              </ScannerHeader>
            )}
            {!isEmulator && <QRCodeScanner />}
          </CameraDimmer>
          {ios && (
            <ScannerHeader>
              <EmulatorPasteUriButton />
            </ScannerHeader>
          )}
        </ScannerContainer>
      </ColorModeProvider>
    </View>
  );
}
