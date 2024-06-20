import React from 'react';
import { StyleSheet } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Box, Column, Columns, Separator, globalColors, useColorMode } from '@/design-system';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { NavigationSteps, useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { opacity } from '@/__swaps__/utils/swaps';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { useBottomPanelGestureHandler } from '../hooks/useBottomPanelGestureHandler';
import { GasButton } from './GasButton';
import { GasPanel } from './GasPanel';
import { ReviewPanel } from './ReviewPanel';
import { SwapActionButton } from './SwapActionButton';

export function SwapBottomPanel() {
  const { isDarkMode } = useColorMode();
  const {
    AnimatedSwapStyles,
    SwapNavigation,
    configProgress,
    confirmButtonIcon,
    confirmButtonIconStyle,
    confirmButtonLabel,
    internalSelectedOutputAsset,
  } = useSwapContext();

  const { swipeToDismissGestureHandler, gestureY } = useBottomPanelGestureHandler();

  const gestureHandlerStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: gestureY.value }],
    };
  });

  const hiddenColumnStyles = useAnimatedStyle(() => {
    return {
      // display: configProgress.value === NavigationSteps.SHOW_REVIEW || configProgress.value === NavigationSteps.SHOW_GAS ? 'none' : 'flex',
      opacity: withTiming(
        configProgress.value === NavigationSteps.SHOW_REVIEW || configProgress.value === NavigationSteps.SHOW_GAS ? 0 : 1,
        TIMING_CONFIGS.fadeConfig
      ),
      pointerEvents:
        configProgress.value === NavigationSteps.SHOW_REVIEW || configProgress.value === NavigationSteps.SHOW_GAS ? 'none' : 'auto',
    };
  });

  const visibleColumnStyles = useAnimatedStyle(() => {
    return {
      // display: configProgress.value === NavigationSteps.SHOW_REVIEW || configProgress.value === NavigationSteps.SHOW_GAS ? 'flex' : 'none',
      opacity: withTiming(
        configProgress.value === NavigationSteps.SHOW_REVIEW || configProgress.value === NavigationSteps.SHOW_GAS ? 1 : 0,
        TIMING_CONFIGS.fadeConfig
      ),
      pointerEvents:
        configProgress.value === NavigationSteps.SHOW_REVIEW || configProgress.value === NavigationSteps.SHOW_GAS ? 'auto' : 'none',
    };
  });

  return (
    // @ts-expect-error Property 'children' does not exist on type
    <PanGestureHandler maxPointers={1} onGestureEvent={swipeToDismissGestureHandler}>
      <Animated.View
        style={[
          styles.swapActionsWrapper,
          gestureHandlerStyles,
          AnimatedSwapStyles.keyboardStyle,
          AnimatedSwapStyles.swapActionWrapperStyle,
        ]}
      >
        <ReviewPanel />
        <GasPanel />
        <Box zIndex={20}>
          <Animated.View style={hiddenColumnStyles}>
            <Columns alignVertical="center" space="12px">
              <Column width="content">
                <GasButton />
              </Column>
              <Column width="content">
                <Box height={{ custom: 32 }}>
                  <Separator color={{ custom: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR }} direction="vertical" thickness={1} />
                </Box>
              </Column>
              <SwapActionButton
                asset={internalSelectedOutputAsset}
                icon={confirmButtonIcon}
                iconStyle={confirmButtonIconStyle}
                label={confirmButtonLabel}
                onPressWorklet={SwapNavigation.handleSwapAction}
                scaleTo={0.9}
              />
            </Columns>
          </Animated.View>
          <Animated.View style={[visibleColumnStyles, { bottom: 0, height: 48, position: 'absolute', width: '100%' }]}>
            <SwapActionButton
              asset={internalSelectedOutputAsset}
              icon={confirmButtonIcon}
              iconStyle={confirmButtonIconStyle}
              label={confirmButtonLabel}
              onPressWorklet={SwapNavigation.handleSwapAction}
              scaleTo={0.9}
            />
          </Animated.View>
        </Box>
      </Animated.View>
    </PanGestureHandler>
  );
}

export const styles = StyleSheet.create({
  reviewViewBackground: {
    margin: 12,
    flex: 1,
  },
  reviewMainBackground: {
    borderRadius: 40,
    borderColor: opacity(globalColors.darkGrey, 0.2),
    borderCurve: 'continuous',
    borderWidth: 1.33,
    gap: 24,
    padding: 24,
    overflow: 'hidden',
  },
  swapActionsWrapper: {
    borderCurve: 'continuous',
    borderWidth: THICK_BORDER_WIDTH,
    overflow: 'hidden',
    paddingBottom: 16 - THICK_BORDER_WIDTH,
    position: 'absolute',
    zIndex: 15,
  },
});
