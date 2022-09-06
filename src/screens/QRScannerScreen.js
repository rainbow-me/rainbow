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

const Background = styled.View({
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
  top: 0,
});

export default function QRScannerScreen() {
  const { result: isEmulator } = useIsEmulator();

  return (
    <View pointerEvents="box-none">
      <ColorModeProvider value="darkTinted">
        <Box position="absolute" top={0} width="full" style={{ zIndex: 1 }}>
          <Navbar title="Scan" />
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
