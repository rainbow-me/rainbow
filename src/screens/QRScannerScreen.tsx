import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useIsEmulator } from 'react-native-device-info';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/header';
import { Centered } from '@/components/layout';
import { Navbar } from '@/components/navbar/Navbar';
import { CameraDimmer, EmulatorPasteUriButton, QRCodeScanner } from '@/components/qrcode-scanner';
import { AccentColorProvider, Box, ColorModeProvider, Text } from '@/design-system';
import { useDimensions, useHardwareBack, useScanner } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { usePagerPosition } from '@/navigation/ScrollPositionContext';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { useTheme } from '@/theme';
import { useIsFocused } from '@react-navigation/native';
import { useIsForeground } from '@/hooks/useIsForeground';
import { useCameraPermission, useCodeScanner } from 'react-native-vision-camera';

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
  const { width: deviceWidth } = useDimensions();
  const { result: isEmulator } = useIsEmulator();
  const { navigate } = useNavigation();
  const scrollPosition = usePagerPosition();
  const { top: topInset } = useSafeAreaInsets();
  const { colors } = useTheme();
  const { hasPermission, requestPermission } = useCameraPermission();
  const isFocused = useIsFocused();
  const isForeground = useIsForeground();
  const [cameraActive, setCameraActive] = useState(true);
  const isActive = isFocused && isForeground && hasPermission;
  const navigation = useNavigation();

  const [flashEnabled, setFlashEnabled] = useState(false);

  const hideCamera = useCallback(() => {
    setFlashEnabled(false);
  }, [setFlashEnabled]);

  const { onScan } = useScanner(hasPermission, hideCamera);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: codes => {
      if (codes[0].value) {
        onScan({ data: codes[0].value });
      }
    },
  });

  useHardwareBack(hideCamera);

  // cleanup for swiping away
  useEffect(() => {
    const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', e => {
      e.preventDefault();
      setCameraActive(false);
      setFlashEnabled(false);
      setTimeout(() => {
        navigation.dispatch(e.data.action);
      }, 0);
    });

    return unsubscribeBeforeRemove;
  }, [navigation]);

  // cleanup for using the back button
  const handleCloseScanner = useCallback(() => {
    setFlashEnabled(false);
    setCameraActive(false);
    setTimeout(() => {
      navigate(Routes.WALLET_SCREEN);
    }, 0);
  }, [navigate]);

  const containerStyle = useAnimatedStyle(() => {
    // const scale = interpolate(scrollPosition.value, [0, 1], [1, 0.8]);

    const translateX = interpolate(
      // @ts-expect-error Javascript Context
      scrollPosition?.value || 0,
      [0, 1],
      [0, deviceWidth - 72]
    );

    return {
      transform: [
        // {
        //   scale,
        // },
        {
          translateX,
        },
      ],
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    // @ts-expect-error Javascript Context
    const opacity = interpolate(scrollPosition?.value || 0, [0, 1], [0, 1]);

    return {
      opacity,
    };
  });

  return (
    <Box style={{ backgroundColor: colors.trueBlack }}>
      <Box as={Animated.View} pointerEvents="box-none" style={containerStyle}>
        <ColorModeProvider value="darkTinted">
          <Box position="absolute" top={{ custom: topInset }} width="full" style={{ zIndex: 1 }}>
            <Navbar
              hasStatusBarInset={false}
              leftComponent={
                <Navbar.Item onPress={handleCloseScanner}>
                  <Box alignItems="center" justifyContent="center" height={{ custom: 36 }} width={{ custom: 36 }}>
                    <Text align="center" color="label" size="icon 20px" weight="semibold">
                      􀆄
                    </Text>
                  </Box>
                </Navbar.Item>
              }
              rightComponent={
                <AccentColorProvider color="#FFDA24">
                  <Navbar.Item onPress={() => setFlashEnabled(!flashEnabled)}>
                    <Box alignItems="center" justifyContent="center" height={{ custom: 36 }} width={{ custom: 36 }}>
                      <Text align="center" color={flashEnabled ? 'accent' : 'label'} size="icon 20px" weight="semibold">
                        {flashEnabled ? '􀞋' : '􀝌'}
                      </Text>
                    </Box>
                  </Navbar.Item>
                </AccentColorProvider>
              }
              title="Scan to Connect"
            />
          </Box>
          <ScannerContainer>
            <Background />
            <CameraDimmer cameraVisible={true}>
              <QRCodeScanner
                flashEnabled={flashEnabled}
                codeScanner={codeScanner}
                hasPermission={hasPermission}
                requestPermission={requestPermission}
                isActive={isActive && cameraActive}
              />
            </CameraDimmer>
          </ScannerContainer>
        </ColorModeProvider>
        <Box
          as={Animated.View}
          pointerEvents="none"
          position="absolute"
          style={[
            overlayStyle,
            {
              backgroundColor: colors.trueBlack,
              height: '100%',
              width: '100%',
              zIndex: 100,
            },
          ]}
        />
      </Box>
    </Box>
  );
}
