import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Box, Cover, TextIcon, useColorMode } from '@/design-system';
import { IS_IOS } from '@/env';
import { deviceUtils } from '@/utils';
import { AnimatedBlurView } from '@/__swaps__/screens/Swap/components/AnimatedBlurView';
import { RAINBOW_HOME, useBrowserContext } from './BrowserContext';
import { TAB_VIEW_COLUMN_WIDTH } from './Dimensions';
import { TIMING_CONFIGS } from '../animations/animationConfigs';

// ⚠️ TODO: Fix close button press detection — currently being blocked
// by the gesture handlers within the BrowserTab component.

export const X_BUTTON_SIZE = 22;
export const X_BUTTON_PADDING = 6;

const INVERTED_WEBVIEW_SCALE = deviceUtils.dimensions.width / TAB_VIEW_COLUMN_WIDTH;
const SINGLE_TAB_INVERTED_WEBVIEW_SCALE = 10 / 7;

const SCALE_ADJUSTED_X_BUTTON_SIZE = X_BUTTON_SIZE * INVERTED_WEBVIEW_SCALE;
const SCALE_ADJUSTED_X_BUTTON_PADDING = X_BUTTON_PADDING * INVERTED_WEBVIEW_SCALE;

const SCALE_ADJUSTED_X_BUTTON_SIZE_SINGLE_TAB = X_BUTTON_SIZE * SINGLE_TAB_INVERTED_WEBVIEW_SCALE;
const SCALE_ADJUSTED_X_BUTTON_PADDING_SINGLE_TAB = X_BUTTON_PADDING * SINGLE_TAB_INVERTED_WEBVIEW_SCALE;

export const CloseTabButton = ({ onPress, tabIndex }: { onPress: () => void; tabIndex: number }) => {
  const { animatedActiveTabIndex, tabStates, tabViewProgress, tabViewVisible } = useBrowserContext();
  const { isDarkMode } = useColorMode();

  const multipleTabsOpen = tabStates.length > 1;
  const tabUrl = tabStates[tabIndex]?.url;
  const isOnHomepage = tabUrl === RAINBOW_HOME;
  const buttonSize = multipleTabsOpen ? SCALE_ADJUSTED_X_BUTTON_SIZE : SCALE_ADJUSTED_X_BUTTON_SIZE_SINGLE_TAB;
  const buttonPadding = multipleTabsOpen ? SCALE_ADJUSTED_X_BUTTON_PADDING : SCALE_ADJUSTED_X_BUTTON_PADDING_SINGLE_TAB;

  const closeButtonStyle = useAnimatedStyle(() => {
    const progress = tabViewProgress?.value || 0;
    const isActiveTab = animatedActiveTabIndex?.value === tabIndex;

    // Switch to using progress-based interpolation when the tab view is
    // entered. This is mainly to avoid showing the close button in the
    // active tab until the tab view animation is near complete.
    const interpolatedOpacity = interpolate(progress, [0, 80, 100], [isActiveTab ? 0 : 1, isActiveTab ? 0 : 1, 1]);
    const opacity =
      (multipleTabsOpen || !isOnHomepage) && (tabViewVisible?.value || !isActiveTab)
        ? interpolatedOpacity
        : withTiming(0, TIMING_CONFIGS.fastFadeConfig);
    return { opacity };
  });

  const pointerEventsStyle = useAnimatedStyle(() => {
    const pointerEvents = tabViewVisible?.value && (multipleTabsOpen || !isOnHomepage) ? 'auto' : 'none';
    return { pointerEvents };
  });

  return (
    <Cover pointerEvents="box-none" style={styles.containerStyle}>
      <Animated.View style={[styles.closeButtonWrapperStyle, pointerEventsStyle, { right: buttonPadding, top: buttonPadding }]}>
        <TouchableOpacity activeOpacity={0.6} hitSlop={buttonPadding} onPress={onPress}>
          {IS_IOS ? (
            <Box
              as={AnimatedBlurView}
              blurAmount={10}
              blurType={isDarkMode ? 'materialDark' : 'materialLight'}
              style={[styles.closeButtonStyle, closeButtonStyle, { borderRadius: buttonSize / 2 }]}
            >
              <Box background="fillSecondary" borderRadius={buttonSize / 2} height="full" position="absolute" width="full" />
              <XIcon buttonSize={buttonSize} multipleTabsOpen={multipleTabsOpen} />
            </Box>
          ) : (
            <Box
              as={Animated.View}
              background="fillTertiary"
              style={[styles.closeButtonStyle, closeButtonStyle, { height: buttonSize, width: buttonSize }]}
            >
              <XIcon buttonSize={buttonSize} multipleTabsOpen={multipleTabsOpen} />
            </Box>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Cover>
  );
};

const XIcon = ({ buttonSize, multipleTabsOpen }: { buttonSize: number; multipleTabsOpen: boolean }) => {
  return (
    <TextIcon
      color="labelTertiary"
      containerSize={buttonSize}
      size={multipleTabsOpen ? 'icon 28px' : 'icon 17px'}
      textStyle={multipleTabsOpen ? undefined : { paddingBottom: 0.5 }}
      weight="bold"
    >
      􀆄
    </TextIcon>
  );
};

const styles = StyleSheet.create({
  closeButtonStyle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonWrapperStyle: {
    position: 'absolute',
  },
  containerStyle: {
    zIndex: 99999999999,
  },
});
