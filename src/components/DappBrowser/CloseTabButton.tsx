import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { SharedValue, interpolate, runOnUI, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { Box, Cover, TextIcon, useColorMode } from '@/design-system';
import { IS_IOS } from '@/env';
import { deviceUtils } from '@/utils';
import { AnimatedBlurView } from '@/__swaps__/screens/Swap/components/AnimatedBlurView';
import { useBrowserContext } from './BrowserContext';
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

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const CloseTabButton = ({
  multipleTabsOpen,
  multipleTabsOpenBoolean,
  tabId,
  tabIndex,
}: {
  multipleTabsOpen: SharedValue<number>;
  multipleTabsOpenBoolean: SharedValue<boolean>;
  tabId: string;
  tabIndex: number;
}) => {
  const { animatedActiveTabIndex, closeTabWorklet, currentlyOpenTabIds, tabViewProgress, tabViewVisible } = useBrowserContext();
  const { isDarkMode } = useColorMode();

  const closeButtonStyle = useAnimatedStyle(() => {
    const progress = tabViewProgress?.value || 0;
    const rawAnimatedTabIndex = currentlyOpenTabIds?.value.indexOf(tabId);
    const animatedTabIndex = rawAnimatedTabIndex === -1 ? tabIndex : rawAnimatedTabIndex ?? tabIndex;
    const animatedIsActiveTab = animatedActiveTabIndex?.value === animatedTabIndex;

    // Switch to using progress-based interpolation when the tab view is
    // entered. This is mainly to avoid showing the close button in the
    // active tab until the tab view animation is near complete.
    const interpolatedOpacity = interpolate(progress, [0, 80, 100], [animatedIsActiveTab ? 0 : 1, animatedIsActiveTab ? 0 : 1, 1]);
    const opacity = tabViewVisible?.value || !animatedIsActiveTab ? interpolatedOpacity : withTiming(0, TIMING_CONFIGS.fastFadeConfig);

    return { opacity };
  });

  const containerStyle = useAnimatedStyle(() => {
    const buttonPadding = multipleTabsOpenBoolean.value ? SCALE_ADJUSTED_X_BUTTON_PADDING : SCALE_ADJUSTED_X_BUTTON_PADDING_SINGLE_TAB;
    const buttonSize = multipleTabsOpenBoolean.value ? SCALE_ADJUSTED_X_BUTTON_SIZE : SCALE_ADJUSTED_X_BUTTON_SIZE_SINGLE_TAB;
    const pointerEvents = tabViewVisible?.value ? 'auto' : 'none';
    return {
      height: buttonSize,
      pointerEvents,
      right: buttonPadding,
      top: buttonPadding,
      width: buttonSize,
    };
  });

  const multipleTabsStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(multipleTabsOpen.value, [0, 0.9, 1], [0, 0, 1], 'clamp'),
      pointerEvents: multipleTabsOpenBoolean.value ? 'auto' : 'none',
    };
  });

  const singleTabStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(multipleTabsOpen.value, [0, 0.1, 1], [1, 0, 0], 'clamp'),
      // opacity: multipleTabsOpenBoolean.value ? 0 : withTiming(1, TIMING_CONFIGS.tabPressConfig),
      pointerEvents: multipleTabsOpenBoolean.value ? 'none' : 'auto',
    };
  });

  const hitSlopProp = useDerivedValue(() => {
    const buttonPadding = multipleTabsOpenBoolean.value ? SCALE_ADJUSTED_X_BUTTON_PADDING : SCALE_ADJUSTED_X_BUTTON_PADDING_SINGLE_TAB;
    return withTiming(buttonPadding, TIMING_CONFIGS.tabPressConfig);
  });

  return (
    <Cover pointerEvents="box-none" style={styles.containerStyle}>
      <Animated.View style={[styles.closeButtonWrapperStyle, containerStyle]}>
        <AnimatedTouchableOpacity activeOpacity={0.6} hitSlop={hitSlopProp} onPress={() => runOnUI(closeTabWorklet)(tabId, tabIndex)}>
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
                background="fillTertiary"
                style={[
                  styles.closeButtonStyle,
                  closeButtonStyle,
                  { height: SCALE_ADJUSTED_X_BUTTON_SIZE_SINGLE_TAB, width: SCALE_ADJUSTED_X_BUTTON_SIZE_SINGLE_TAB },
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
                background="fillTertiary"
                style={[
                  styles.closeButtonStyle,
                  closeButtonStyle,
                  { height: SCALE_ADJUSTED_X_BUTTON_SIZE, width: SCALE_ADJUSTED_X_BUTTON_SIZE },
                ]}
              >
                <XIcon buttonSize={SCALE_ADJUSTED_X_BUTTON_SIZE} multipleTabsOpen={true} />
              </Box>
            )}
          </Box>
        </AnimatedTouchableOpacity>
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
