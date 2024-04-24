import React, { useState } from 'react';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';

import { Box, Column, Columns, Separator, globalColors, useColorMode } from '@/design-system';
import { safeAreaInsetValues } from '@/utils';

import { SwapActionButton } from '../../components/SwapActionButton';
import { GasButton } from '@/__swaps__/screens/Swap/components/GasButton';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH, springConfig } from '../../constants';
import { IS_ANDROID } from '@/env';
import { useSwapContext, NavigationSteps } from '@/__swaps__/screens/Swap/providers/swap-provider';
import Animated, { runOnJS, runOnUI, useAnimatedProps, useAnimatedReaction, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { opacity } from '@/__swaps__/utils/swaps';
import { ReviewPanel } from '../panels/ReviewPanel';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useSwapActionsGestureHandler } from './useSwapActionsGestureHandler';
import { GasPanel } from '../panels/GasPanel';

export function SwapActions() {
  const { isDarkMode } = useColorMode();
  const {
    confirmButtonIcon,
    confirmButtonIconStyle,
    confirmButtonLabel,
    SwapInputController,
    AnimatedSwapStyles,
    SwapNavigation,
    configProgress,
  } = useSwapContext();

  const { swipeToDismissGestureHandler, gestureY } = useSwapActionsGestureHandler();
  const [enabled, setEnabled] = useState(false);

  useAnimatedReaction(
    () => ({
      configProgress: configProgress.value,
    }),
    ({ configProgress }) => {
      if (configProgress === NavigationSteps.SHOW_REVIEW || configProgress === NavigationSteps.SHOW_GAS) {
        runOnJS(setEnabled)(true);
      } else {
        runOnJS(setEnabled)(false);
      }
    }
  );

  const gestureHandlerStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: gestureY.value > 0 ? withSpring(gestureY.value, springConfig) : withSpring(0, springConfig) }],
    };
  });

  const hiddenColumnStyles = useAnimatedStyle(() => {
    return {
      display: configProgress.value === NavigationSteps.SHOW_REVIEW || configProgress.value === NavigationSteps.SHOW_GAS ? 'none' : 'flex',
    };
  });

  return (
    // @ts-expect-error Property 'children' does not exist on type
    <PanGestureHandler maxPointers={1} onGestureEvent={swipeToDismissGestureHandler} enabled={enabled}>
      <Box
        as={Animated.View}
        paddingBottom={{
          custom: IS_ANDROID ? getSoftMenuBarHeight() - 32 : safeAreaInsetValues.bottom + 16,
        }}
        paddingHorizontal="20px"
        style={[
          AnimatedSwapStyles.swapActionWrapperStyle,
          AnimatedSwapStyles.keyboardStyle,
          gestureHandlerStyles,
          styles.swapActionsWrapper,
        ]}
        width="full"
        zIndex={15}
      >
        <ReviewPanel />
        <GasPanel />
        <Columns alignVertical="center" space="12px">
          <Column style={hiddenColumnStyles} width="content">
            <GasButton />
          </Column>
          <Column style={hiddenColumnStyles} width="content">
            <Box height={{ custom: 32 }}>
              <Separator color={{ custom: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR }} direction="vertical" thickness={1} />
            </Box>
          </Column>
          <SwapActionButton
            onPress={() => runOnUI(SwapNavigation.handleSwapAction)()}
            color={SwapInputController.bottomColor}
            icon={confirmButtonIcon}
            iconStyle={confirmButtonIconStyle}
            label={confirmButtonLabel}
            scaleTo={0.9}
          />
        </Columns>
      </Box>
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
    borderTopWidth: THICK_BORDER_WIDTH,
    borderCurve: 'continuous',
    paddingBottom: IS_ANDROID ? getSoftMenuBarHeight() - 24 : safeAreaInsetValues.bottom + 16,
  },
});
