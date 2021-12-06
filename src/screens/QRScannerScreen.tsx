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
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
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
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  const [initializeCamera, setInitializeCamera] = useState(ios ? true : false);
  const { navigate } = useNavigation();
  const [cameraVisible, setCameraVisible] = useState();

  const dsRef = useRef();
  useEffect(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'addOnCrossMagicBorderListener' does not ... Remove this comment to see the full error message
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

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const { result: isEmulator } = useIsEmulator();
  const androidSheetPosition = useSharedValue(0);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <View pointerEvents="box-none">
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
        {ios ? <DiscoverSheet ref={dsRef} /> : null}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ScannerContainer>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Background />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <CameraDimmer cameraVisible={cameraVisible}>
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name
            'android'.
            {android && (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <ScannerHeader>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <BackButton
                  color={colors.whiteLabel}
                  direction="left"
                  onPress={handlePressBackButton}
                  testID="goToBalancesFromScanner"
                />
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <EmulatorPasteUriButton />
              </ScannerHeader>
            )}
            {initializeCamera && !isEmulator && (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <QRCodeScanner
                contentPositionTop={HeaderHeight}
                dsRef={dsRef}
                enableCamera={isFocused}
              />
            )}
          </CameraDimmer>
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name
          'android'.
          {android ? (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <DiscoverSheet ref={dsRef} sheetPosition={androidSheetPosition} />
          ) : (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <ScannerHeader>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <BackButton
                color={colors.whiteLabel}
                direction="left"
                onPress={handlePressBackButton}
                testID="goToBalancesFromScanner"
              />
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <EmulatorPasteUriButton />
            </ScannerHeader>
          )}
        </ScannerContainer>
      </View>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <FabWrapper
        fabs={[SearchFab]}
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'onFabSearch' does not exist on type 'nev... Remove this comment to see the full error message
        onPress={() => dsRef.current?.onFabSearch?.current()}
      />
    </>
  );
}
