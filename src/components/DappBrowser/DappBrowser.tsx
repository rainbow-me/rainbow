import { BlurView } from '@react-native-community/blur';
import React, { useEffect, useState } from 'react';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';
import RNFS from 'react-native-fs';

import { SheetGestureBlocker } from '@/components/sheet/SheetGestureBlocker';
import { Page } from '@/components/layout';
import { Box, ColorModeProvider, globalColors, useForegroundColor } from '@/design-system';
import { useDimensions } from '@/hooks';
import { safeAreaInsetValues } from '@/utils';
import { BrowserContextProvider, useBrowserContext } from './BrowserContext';
import { AddressBar } from './AddressBar';
import { BrowserToolbar } from './BrowserToolbar';
import { BrowserTab } from './BrowserTab';
import { StyleSheet } from 'react-native';
import { TAB_VIEW_ROW_HEIGHT } from './Dimensions';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

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
  const { width: deviceWidth } = useDimensions();
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const keyboard = useAnimatedKeyboard();

  const backgroundStyle = useAnimatedStyle(
    () => ({
      opacity: tabViewProgress?.value ?? 0,
    }),
    []
  );

  const bottomBarStyle = useAnimatedStyle(
    () => ({
      height: safeAreaInsetValues.bottom + 46 + 58 * (1 - (tabViewProgress?.value ?? 0)),
      transform: [{ translateY: Math.min(-(keyboard.height.value - 70), -50) }],
    }),
    []
  );

  console.log('injectedJS', injectedJS);

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
          as={AnimatedBlurView}
          blurAmount={25}
          blurType="chromeMaterialDark"
          justifyContent="flex-end"
          bottom={{ custom: 0 }}
          paddingBottom={{ custom: safeAreaInsetValues.bottom }}
          pointerEvents="box-none"
          position="absolute"
          style={[bottomBarStyle, { zIndex: 10000 }]}
          width={{ custom: deviceWidth }}
        >
          <AddressBar />
          <BrowserToolbar />
          <Box height={{ custom: 0.5 }} position="absolute" style={{ backgroundColor: separatorSecondary }} top="0px" width="full" />
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
