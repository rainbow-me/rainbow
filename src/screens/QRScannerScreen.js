import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useIsEmulator } from 'react-native-device-info';
import { useSharedValue } from 'react-native-reanimated';
import styled from 'styled-components';
import { DiscoverSheet } from '../components/discover-sheet';
import { FabWrapper, SearchFab } from '../components/fab';
import { BackButton, Header, HeaderHeight } from '../components/header';
import { Centered } from '../components/layout';

import {
  CameraDimmer,
  EmulatorPasteUriButton,
  QRCodeScanner,
} from '../components/qrcode-scanner';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { position } from '@rainbow-me/styles';

const Background = styled.View`
  background-color: black;
  height: 100%;
  position: absolute;
  width: 100%;
`;

const ScannerContainer = styled(Centered).attrs({
  direction: 'column',
})`
  ${position.size('100%')};
  overflow: hidden;
`;

const ScannerHeader = styled(Header).attrs({
  justify: 'space-between',
  testID: 'scanner-header',
})`
  position: absolute;
  top: 0;
`;

export default function QRScannerScreen() {
  const isFocused = useIsFocused();
  const [initializeCamera, setInitializeCamera] = useState(ios ? true : false);
  const { navigate } = useNavigation();
  const [cameraVisible, setCameraVisible] = useState();

  const dsRef = useRef();
  useEffect(
    () => dsRef.current?.addOnCrossMagicBorderListener(setCameraVisible),
    []
  );

  const handlePressBackButton = useCallback(
    () => navigate(Routes.WALLET_SCREEN),
    [navigate]
  );

  useEffect(() => {
    cameraVisible && !initializeCamera && setInitializeCamera(true);
  }, [cameraVisible, initializeCamera]);

  const { colors } = useTheme();
  const { result: isEmulator } = useIsEmulator();
  const androidSheetPosition = useSharedValue(0);

  return (
    <>
      <View pointerEvents="box-none">
        {ios ? <DiscoverSheet ref={dsRef} /> : null}
        <ScannerContainer>
          <Background />
          <CameraDimmer cameraVisible={cameraVisible}>
            {android && (
              <ScannerHeader>
                <BackButton
                  color={colors.whiteLabel}
                  direction="left"
                  onPress={handlePressBackButton}
                  testID="goToBalancesFromScanner"
                />
                <EmulatorPasteUriButton />
              </ScannerHeader>
            )}
            {initializeCamera && !isEmulator && (
              <QRCodeScanner
                contentPositionTop={HeaderHeight}
                dsRef={dsRef}
                enableCamera={isFocused}
              />
            )}
          </CameraDimmer>
          {android ? (
            <DiscoverSheet ref={dsRef} sheetPosition={androidSheetPosition} />
          ) : (
            <ScannerHeader>
              <BackButton
                color={colors.whiteLabel}
                direction="left"
                onPress={handlePressBackButton}
                testID="goToBalancesFromScanner"
              />
              <EmulatorPasteUriButton />
            </ScannerHeader>
          )}
        </ScannerContainer>
      </View>
      <FabWrapper
        fabs={[SearchFab]}
        onPress={() => dsRef.current?.onFabSearch?.current()}
      />
    </>
  );
}
