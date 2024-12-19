import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Box, TextIcon, useColorMode } from '@/design-system';
import { IS_IOS } from '@/env';
import { deviceUtils } from '@/utils';
import { AnimatedBlurView } from '../AnimatedComponents/AnimatedBlurView';
import { useBrowserContext } from './BrowserContext';
import { TAB_VIEW_COLUMN_WIDTH } from './Dimensions';
import { TIMING_CONFIGS } from '../animations/animationConfigs';
import { RAINBOW_HOME } from './constants';
import { TabId, TabViewGestureStates } from './types';
import { getTabInfo } from './utils/getTabInfo';

export const X_BUTTON_SIZE = 22;
export const X_BUTTON_PADDING = 6;
export const X_BUTTON_TAPPABLE_AREA = X_BUTTON_SIZE + X_BUTTON_PADDING * 2;

const INVERTED_WEBVIEW_SCALE = deviceUtils.dimensions.width / TAB_VIEW_COLUMN_WIDTH;
const SINGLE_TAB_INVERTED_WEBVIEW_SCALE = 10 / 7;

const SCALE_ADJUSTED_X_BUTTON_SIZE = X_BUTTON_SIZE * INVERTED_WEBVIEW_SCALE;
const SCALE_ADJUSTED_X_BUTTON_PADDING = X_BUTTON_PADDING * INVERTED_WEBVIEW_SCALE;

const SCALE_ADJUSTED_X_BUTTON_SIZE_SINGLE_TAB = X_BUTTON_SIZE * SINGLE_TAB_INVERTED_WEBVIEW_SCALE;
const SCALE_ADJUSTED_X_BUTTON_PADDING_SINGLE_TAB = X_BUTTON_PADDING * SINGLE_TAB_INVERTED_WEBVIEW_SCALE;

export const CloseTabButton = ({ tabId }: { tabId: TabId }) => {
  const {
    animatedActiveTabIndex,
    animatedMultipleTabsOpen,
    animatedTabUrls,
    currentlyOpenTabIds,
    multipleTabsOpen,
    pendingTabSwitchOffset,
    tabViewGestureProgress,
    tabViewGestureState,
    tabViewProgress,
    tabViewVisible,
  } = useBrowserContext();
  const { isDarkMode } = useColorMode();

  const closeButtonStyle = useAnimatedStyle(() => {
    const { isFullSizeTab, isPendingActiveTab } = getTabInfo({
      animatedActiveTabIndex: animatedActiveTabIndex.value,
      currentlyOpenTabIds: currentlyOpenTabIds.value,
      pendingTabSwitchOffset: pendingTabSwitchOffset.value,
      tabId,
      tabViewGestureState: tabViewGestureState.value,
      tabViewProgress: tabViewProgress.value,
    });

    const isRunningEnterTabViewAnimation = tabViewGestureState.value === TabViewGestureStates.DRAG_END_ENTERING;
    const isSwitchingTabs = tabViewGestureState.value !== TabViewGestureStates.INACTIVE;
    const animatedIsActiveTab = isPendingActiveTab || currentlyOpenTabIds.value.length === 0;

    const startOpacity = isFullSizeTab ? 0 : 1;
    const endOpacity = isSwitchingTabs && isFullSizeTab && !isRunningEnterTabViewAnimation ? 0 : 1;

    // Switch to using progress-based interpolation when the tab view is
    // entered. This is mainly to avoid showing the close button in the
    // active tab until the tab view animation is near complete.
    const interpolatedOpacity = interpolate(
      isRunningEnterTabViewAnimation ? tabViewGestureProgress.value : tabViewProgress.value,
      [0, 0, 80, 100],
      [0, startOpacity, startOpacity, endOpacity],
      'clamp'
    );
    const opacity = tabViewVisible.value || !animatedIsActiveTab ? interpolatedOpacity : withTiming(0, TIMING_CONFIGS.fastFadeConfig);

    return { opacity };
  });

  const containerStyle = useAnimatedStyle(() => {
    const buttonPadding = multipleTabsOpen.value ? SCALE_ADJUSTED_X_BUTTON_PADDING : SCALE_ADJUSTED_X_BUTTON_PADDING_SINGLE_TAB;
    const buttonSize = multipleTabsOpen.value ? SCALE_ADJUSTED_X_BUTTON_SIZE : SCALE_ADJUSTED_X_BUTTON_SIZE_SINGLE_TAB;

    const url = animatedTabUrls.value[tabId] || RAINBOW_HOME;
    const isEmptyState = !multipleTabsOpen.value && url === RAINBOW_HOME;
    const opacity = isEmptyState ? withTiming(0, TIMING_CONFIGS.tabPressConfig) : withTiming(1, TIMING_CONFIGS.tabPressConfig);
    const pointerEvents = tabViewVisible.value && !isEmptyState ? 'auto' : 'none';

    return {
      height: buttonSize + buttonPadding * 2,
      opacity,
      pointerEvents,
      right: 0,
      top: 0,
      width: buttonSize + buttonPadding * 2,
    };
  });

  const multipleTabsStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(animatedMultipleTabsOpen.value, [0, 0.9, 1], [0, 0, 1], 'clamp'),
      pointerEvents: multipleTabsOpen.value ? 'auto' : 'none',
    };
  });

  const singleTabStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(animatedMultipleTabsOpen.value, [0, 0.1, 1], [1, 0, 0], 'clamp'),
      pointerEvents: multipleTabsOpen.value ? 'none' : 'auto',
    };
  });

  return (
    <Animated.View style={[styles.containerStyle, containerStyle]}>
      <Box as={Animated.View} position="absolute" style={singleTabStyle}>
        {IS_IOS ? (
          <Box
            as={AnimatedBlurView}
            blurAmount={10}
            blurType={isDarkMode ? 'materialDark' : 'materialLight'}
            style={[styles.closeButtonStyle, closeButtonStyle, { borderRadius: SCALE_ADJUSTED_X_BUTTON_SIZE_SINGLE_TAB / 2 }]}
          >
            <Box
              background="fillSecondary"
              borderRadius={SCALE_ADJUSTED_X_BUTTON_SIZE_SINGLE_TAB / 2}
              height="full"
              position="absolute"
              width="full"
            />
            <XIcon buttonSize={SCALE_ADJUSTED_X_BUTTON_SIZE_SINGLE_TAB} multipleTabsOpen={false} />
          </Box>
        ) : (
          <Box
            as={Animated.View}
            background="fill"
            style={[
              styles.closeButtonStyle,
              closeButtonStyle,
              {
                height: SCALE_ADJUSTED_X_BUTTON_SIZE_SINGLE_TAB,
                width: SCALE_ADJUSTED_X_BUTTON_SIZE_SINGLE_TAB,
                borderRadius: SCALE_ADJUSTED_X_BUTTON_SIZE / 2,
              },
            ]}
          >
            <XIcon buttonSize={SCALE_ADJUSTED_X_BUTTON_SIZE_SINGLE_TAB} multipleTabsOpen={false} />
          </Box>
        )}
      </Box>
      <Box as={Animated.View} position="absolute" style={multipleTabsStyle}>
        {IS_IOS ? (
          <Box
            as={AnimatedBlurView}
            blurAmount={10}
            blurType={isDarkMode ? 'materialDark' : 'materialLight'}
            style={[styles.closeButtonStyle, closeButtonStyle, { borderRadius: SCALE_ADJUSTED_X_BUTTON_SIZE / 2 }]}
          >
            <Box
              background="fillSecondary"
              borderRadius={SCALE_ADJUSTED_X_BUTTON_SIZE / 2}
              height="full"
              position="absolute"
              width="full"
            />
            <XIcon buttonSize={SCALE_ADJUSTED_X_BUTTON_SIZE} multipleTabsOpen={true} />
          </Box>
        ) : (
          <Box
            as={Animated.View}
            background="surfaceSecondary"
            style={[
              styles.closeButtonStyle,
              closeButtonStyle,
              {
                height: SCALE_ADJUSTED_X_BUTTON_SIZE,
                width: SCALE_ADJUSTED_X_BUTTON_SIZE,
                borderRadius: SCALE_ADJUSTED_X_BUTTON_SIZE / 2,
              },
            ]}
          >
            <XIcon buttonSize={SCALE_ADJUSTED_X_BUTTON_SIZE} multipleTabsOpen={true} />
          </Box>
        )}
      </Box>
    </Animated.View>
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
  containerStyle: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 99999999999,
  },
});
