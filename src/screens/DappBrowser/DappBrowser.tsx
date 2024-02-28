import { BlurView } from '@react-native-community/blur';
import React from 'react';
import Animated, { useAnimatedKeyboard, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';

import { SheetGestureBlocker } from '@/components/sheet/SheetGestureBlocker';
import { Page } from '@/components/layout';
import { Box, ColorModeProvider, globalColors, useForegroundColor } from '@/design-system';
import { useDimensions } from '@/hooks';
import { safeAreaInsetValues } from '@/utils';
import { BrowserContextProvider, useBrowserContext } from './BrowserContext';
import { AddressBar } from './AddressBar';
import { BrowserToolbar } from './BrowserToolbar';
import { BrowserTab } from './BrowserTab';
import { Easing, StyleSheet } from 'react-native';
import { TAB_VIEW_ROW_HEIGHT } from './Dimensions';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const timingConfig = {
  duration: 500,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
};

const DappBrowserComponent = () => {
  const { scrollViewRef, tabStates, tabViewProgress, tabViewVisible } = useBrowserContext();
  const { width: deviceWidth } = useDimensions();
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const loadProgress = useSharedValue(0);

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
      transform: [{ translateY: Math.min(-(keyboard.height.value - 70), 0) }],
    }),
    []
  );

  const progressBarStyle = useAnimatedStyle(
    () => ({
      opacity: loadProgress.value === 1 ? withTiming(0, timingConfig) : withTiming(1, timingConfig),
      width: loadProgress.value * deviceWidth,
    }),
    []
  );

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
            <BrowserTab key={index} loadProgress={loadProgress} tabIndex={index} />
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
          <Box as={Animated.View} background="blue" style={[styles.progressBar, progressBarStyle]} />
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
  progressBar: {
    // bottom: safeAreaInsetValues.bottom + 102,
    height: 2,
    left: 0,
    position: 'absolute',
    top: 0,
    zIndex: 11000,
  },
  rootViewBackground: {
    // backgroundColor: globalColors.grey100,
    backgroundColor: 'transparent',
    flex: 1,
    // paddingBottom: safeAreaInsetValues.bottom + 48,
    // paddingTop: safeAreaInsetValues.top,
  },
});
