import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { useCode, useSharedValue } from 'react-native-reanimated';
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
import { scrollPosition } from '@rainbow-me/navigation/ScrollPagerWrapper';
import Routes from '@rainbow-me/routes';
import { position } from '@rainbow-me/styles';

const { call, greaterThan, onChange } = Animated;

const ENABLING_CAMERA_OFFSET = 1.01;

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
})`
  position: absolute;
  top: 0;
`;

function useFocusFromSwipe() {
  const [isFocused, setIsFocused] = useState(false);
  useCode(
    () =>
      onChange(
        greaterThan(scrollPosition, ENABLING_CAMERA_OFFSET),
        call([scrollPosition], ([pos]) =>
          setIsFocused(pos > ENABLING_CAMERA_OFFSET)
        )
      ),
    []
  );
  return isFocused;
}

export default function QRScannerScreen() {
  const isFocusedIOS = useFocusFromSwipe();
  const isFocusedAndroid = useIsFocused();
  const [initializeCamera, setInitializeCamera] = useState(ios ? true : false);
  const { navigate } = useNavigation();
  const [cameraVisible, setCameraVisible] = useState();

  const cameraDim = useSharedValue(0);
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
    isFocusedAndroid && !initializeCamera && setInitializeCamera(true);
  }, [initializeCamera, isFocusedAndroid]);

  const { colors } = useTheme();

  return (
    <>
      <View pointerEvents="box-none">
        {ios ? <DiscoverSheet ref={dsRef} /> : null}
        <ScannerContainer>
          <Background />
          <CameraDimmer cameraVisible={cameraVisible}>
            {initializeCamera && (
              <QRCodeScanner
                cameraDim={cameraDim}
                contentPositionTop={HeaderHeight}
                dsRef={dsRef}
                enableCamera={ios ? isFocusedIOS : isFocusedAndroid}
              />
            )}
          </CameraDimmer>
          {android ? <DiscoverSheet ref={dsRef} /> : null}
          <ScannerHeader>
            <BackButton
              color={colors.whiteLabel}
              direction="left"
              onPress={handlePressBackButton}
              testID="goToBalancesFromScanner"
            />
            <EmulatorPasteUriButton />
          </ScannerHeader>
        </ScannerContainer>
      </View>
      <FabWrapper
        fabs={[SearchFab]}
        onPress={() => dsRef.current?.onFabSearch?.current()}
      />
    </>
  );
}
