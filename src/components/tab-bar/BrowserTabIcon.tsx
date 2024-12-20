import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { useBrowserTabBarContext } from '@/components/DappBrowser/BrowserContext';
import { ButtonPressAnimation } from '@/components/animations';
import { TabBarIcon } from '@/components/tab-bar/TabBarIcon';
import { Box, useColorMode, TextIcon } from '@/design-system';
import { useBrowserStore } from '@/state/browser/browserStore';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { TIMING_CONFIGS } from '../animations/animationConfigs';
import { TAB_BAR_PILL_HEIGHT, TAB_BAR_PILL_WIDTH } from './dimensions';

export const BrowserTabIcon = memo(function BrowserTabIcon({
  accentColor,
  index,
  reanimatedPosition,
  tabBarIcon,
}: {
  accentColor: string;
  index: number;
  reanimatedPosition: SharedValue<number>;
  tabBarIcon: string;
}) {
  const { isDarkMode } = useColorMode();
  const { goBack, goForward } = useBrowserTabBarContext();

  const navState = useBrowserStore(state => state.getActiveTabNavState());

  const showNavButtons = useDerivedValue(() => reanimatedPosition.value === 2 && (navState.canGoBack || navState.canGoForward));

  const navButtonsBackgroundOpacity = useDerivedValue(() => {
    const navButtonsVisible = reanimatedPosition.value === 2 && (navState.canGoBack || navState.canGoForward);
    return withTiming(navButtonsVisible ? 1 : 0, TIMING_CONFIGS.slowFadeConfig);
  });

  const navButtonsStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: opacityWorklet(accentColor, 0.06 * navButtonsBackgroundOpacity.value),
      opacity: withTiming(showNavButtons.value ? 1 : 0, TIMING_CONFIGS.slowFadeConfig),
      pointerEvents: showNavButtons.value ? 'auto' : 'none',
    };
  });

  const animatedBorderStyle = useAnimatedStyle(() => {
    return {
      borderColor: opacityWorklet(accentColor, (isDarkMode ? 0.08 : 0.04) * navButtonsBackgroundOpacity.value),
    };
  });

  const backButtonStyle = useAnimatedStyle(() => {
    const disabledOpacity = isDarkMode ? 0.2 : 0.28;
    return {
      opacity: withTiming(navState.canGoBack ? 1 : disabledOpacity, TIMING_CONFIGS.slowFadeConfig),
      transform: [
        { translateX: withTiming(showNavButtons.value ? 0 : 16, TIMING_CONFIGS.slowFadeConfig) },
        { scale: withTiming(showNavButtons.value ? 1 : 0.75, TIMING_CONFIGS.slowFadeConfig) },
      ],
    };
  });

  const forwardButtonStyle = useAnimatedStyle(() => {
    const disabledOpacity = isDarkMode ? 0.2 : 0.28;
    return {
      opacity: withTiming(navState.canGoForward ? 1 : disabledOpacity, TIMING_CONFIGS.slowFadeConfig),
      transform: [
        { translateX: withTiming(showNavButtons.value ? 0 : -16, TIMING_CONFIGS.slowFadeConfig) },
        { scale: withTiming(showNavButtons.value ? 1 : 0.75, TIMING_CONFIGS.slowFadeConfig) },
      ],
    };
  });

  const tabIconStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(showNavButtons.value ? 0 : 1, TIMING_CONFIGS.slowFadeConfig),
      pointerEvents: showNavButtons.value ? 'none' : 'auto',
      transform: [{ scale: withTiming(showNavButtons.value ? 0.75 : 1, TIMING_CONFIGS.slowFadeConfig) }],
    };
  });

  return (
    <Box
      testID="dapp-browser-tab-icon"
      width={{ custom: TAB_BAR_PILL_WIDTH }}
      height={{ custom: TAB_BAR_PILL_HEIGHT }}
      alignItems="center"
      justifyContent="center"
    >
      <Animated.View style={[navButtonsStyle, styles.navButtonsPill]}>
        <ButtonPressAnimation
          onPress={() => goBack()}
          scaleTo={0.75}
          style={[styles.navButton, styles.backButton, { pointerEvents: navState.canGoBack ? 'auto' : 'none' }]}
        >
          <Animated.View style={backButtonStyle}>
            <TextIcon color={{ custom: accentColor }} containerSize={32} size="icon 18px" weight="bold">
              􀆉
            </TextIcon>
          </Animated.View>
        </ButtonPressAnimation>
        <ButtonPressAnimation
          onPress={() => goForward()}
          scaleTo={0.75}
          style={[styles.navButton, styles.forwardButton, { pointerEvents: navState.canGoForward ? 'auto' : 'none' }]}
        >
          <Animated.View style={forwardButtonStyle}>
            <TextIcon color={{ custom: accentColor }} containerSize={32} size="icon 18px" weight="bold">
              􀆊
            </TextIcon>
          </Animated.View>
        </ButtonPressAnimation>
        <Animated.View style={[animatedBorderStyle, styles.cover, styles.navButtonsBorder]} />
      </Animated.View>
      <Animated.View style={[tabIconStyle, styles.cover]}>
        <TabBarIcon accentColor={accentColor} icon={tabBarIcon} index={index} reanimatedPosition={reanimatedPosition} />
      </Animated.View>
    </Box>
  );
});

const styles = StyleSheet.create({
  backButton: {
    paddingLeft: 1,
  },
  cover: {
    alignItems: 'center',
    bottom: 0,
    height: '100%',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
  },
  forwardButton: {
    paddingRight: 1,
  },
  navButton: {
    alignItems: 'center',
    height: TAB_BAR_PILL_HEIGHT,
    justifyContent: 'center',
    width: TAB_BAR_PILL_HEIGHT,
  },
  navButtonsBorder: {
    borderCurve: 'continuous',
    borderRadius: TAB_BAR_PILL_HEIGHT / 2,
    borderWidth: THICK_BORDER_WIDTH,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  navButtonsPill: {
    borderRadius: TAB_BAR_PILL_HEIGHT / 2,
    flexDirection: 'row',
    height: TAB_BAR_PILL_HEIGHT,
    width: TAB_BAR_PILL_WIDTH,
  },
});
