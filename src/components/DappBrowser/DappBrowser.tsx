import React, { useEffect, useState } from 'react';
import Animated, { interpolateColor, useAnimatedKeyboard, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';
import RNFS from 'react-native-fs';

import { SheetGestureBlocker } from '@/components/sheet/SheetGestureBlocker';
import { Page } from '@/components/layout';
import { Box, ColorModeProvider, globalColors } from '@/design-system';
import { useDimensions } from '@/hooks';
import { safeAreaInsetValues } from '@/utils';
import { BrowserContextProvider, useBrowserContext } from './BrowserContext';
import { AddressBar } from './AddressBar';
import { BrowserTab } from './BrowserTab';
import { StyleSheet } from 'react-native';
import { TAB_VIEW_ROW_HEIGHT } from './Dimensions';
import { useTheme } from '@/theme';

const AnimatedBox = Animated.createAnimatedComponent(Box);

const getInjectedJS = async () => {
  return RNFS.readFile(`${RNFS.MainBundlePath}/InjectedJSBundle.js`, 'utf8');
};

const DappBrowserComponent = () => {
  const [injectedJS, setInjectedJS] = useState<string | ''>('');

  useEffect(() => {
    const loadInjectedJS = async () => {
      try {
        const jsToInject = await getInjectedJS();
        setInjectedJS(jsToInject);
      } catch (e) {
        console.log('error', e);
      }
    };
    loadInjectedJS();
  }, []);

  const { scrollViewRef, tabStates, tabViewProgress, tabViewVisible } = useBrowserContext();
  const { isDarkMode } = useTheme();
  const [isAddressBarFocused, setIsAddressBarFocused] = useState(false);
  const { width: deviceWidth } = useDimensions();
  const keyboard = useAnimatedKeyboard();

  const backgroundStyle = useAnimatedStyle(
    () => ({
      opacity: tabViewProgress?.value ?? 0,
    }),
    []
  );
  const animationProgress = useSharedValue(0);

  useEffect(() => {
    if (isAddressBarFocused) {
      animationProgress.value = withTiming(1, { duration: 200 });
    } else {
      animationProgress.value = withTiming(0, { duration: 200 });
    }
  }, [animationProgress, isAddressBarFocused]);

  const bottomBarStyle = useAnimatedStyle(() => {
    // Assuming tabViewProgress.value ranges from 0 to 1
    // You can adjust the inputRange based on the actual range of tabViewProgress.value
    const backgroundColor = interpolateColor(
      animationProgress.value ?? 0,
      [0, 1], // inputRange
      ['#191A1C', 'transparent']
    );

    return {
      height: safeAreaInsetValues.bottom + 58 * (1 - (tabViewProgress?.value ?? 0)),
      transform: [{ translateY: Math.min(-(keyboard.height.value - 30), -50) }],
      backgroundColor,
    };
  }, [isAddressBarFocused, isDarkMode, tabViewProgress, keyboard.height]);

  return (
    <SheetGestureBlocker>
      <Box as={Page} height="full" style={styles.rootViewBackground} width="full">
        <Box
          as={Animated.View}
          borderRadius={ScreenCornerRadius}
          height="full"
          position="absolute"
          style={[backgroundStyle, { backgroundColor: globalColors.grey100 }]}
          width="full"
        />
        <Animated.ScrollView
          contentContainerStyle={{
            backgroundColor: globalColors.grey100,
            height: Math.ceil(tabStates.length / 2) * TAB_VIEW_ROW_HEIGHT + safeAreaInsetValues.bottom + 104,
            zIndex: 20000,
          }}
          ref={scrollViewRef}
          scrollEnabled={tabViewVisible}
          showsVerticalScrollIndicator={false}
        >
          {tabStates.map((tab, index) => (
            <BrowserTab key={index} tabIndex={index} injectedJS={injectedJS} />
          ))}
        </Animated.ScrollView>
        <Box
          as={AnimatedBox}
          justifyContent="center"
          bottom={{ custom: 0 }}
          paddingBottom={{ custom: safeAreaInsetValues.bottom }}
          pointerEvents="box-none"
          position="absolute"
          style={[bottomBarStyle, { zIndex: 10000 }]}
          width={{ custom: deviceWidth }}
        >
          <AddressBar setIsAddressBarFocused={setIsAddressBarFocused} />
        </Box>
      </Box>
    </SheetGestureBlocker>
  );
};

export const DappBrowser = () => {
  return (
    <BrowserContextProvider>
      <ColorModeProvider value="dark">
        <DappBrowserComponent />
      </ColorModeProvider>
    </BrowserContextProvider>
  );
};

const styles = StyleSheet.create({
  rootViewBackground: {
    backgroundColor: 'transparent',
    flex: 1,
  },
});
