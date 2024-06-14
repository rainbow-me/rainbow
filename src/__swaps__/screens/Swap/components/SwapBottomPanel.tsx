import React from 'react';
import { StyleSheet } from 'react-native';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';

import { Box, Column, Columns, Separator, globalColors, useColorMode } from '@/design-system';
import { safeAreaInsetValues } from '@/utils';

import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { NavigationSteps, useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { IS_ANDROID } from '@/env';

import { opacity } from '@/__swaps__/utils/swaps';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { useBottomPanelGestureHandler } from '../hooks/useBottomPanelGestureHandler';
import { GasButton } from './GasButton';
import { GasPanel } from './GasPanel';
import { ReviewPanel } from './ReviewPanel';
import { SwapActionButton } from './SwapActionButton';

export function SwapBottomPanel() {
  const { isDarkMode } = useColorMode();
  const { confirmButtonIconStyle, confirmButtonProps, internalSelectedOutputAsset, AnimatedSwapStyles, SwapNavigation, configProgress } =
    useSwapContext();

  const { swipeToDismissGestureHandler, gestureY } = useBottomPanelGestureHandler();

  const gestureHandlerStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY:
            gestureY.value > 0 ? withSpring(gestureY.value, SPRING_CONFIGS.springConfig) : withSpring(0, SPRING_CONFIGS.springConfig),
        },
      ],
    };
  });

  const hiddenColumnStyles = useAnimatedStyle(() => {
    return {
      display: configProgress.value === NavigationSteps.SHOW_REVIEW || configProgress.value === NavigationSteps.SHOW_GAS ? 'none' : 'flex',
    };
  });

  const icon = useDerivedValue(() => confirmButtonProps.value.icon);
  const label = useDerivedValue(() => confirmButtonProps.value.label);
  const disabled = useDerivedValue(() => confirmButtonProps.value.disabled);

  return (
    // @ts-expect-error Property 'children' does not exist on type
    <PanGestureHandler maxPointers={1} onGestureEvent={swipeToDismissGestureHandler}>
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
            onPressWorklet={SwapNavigation.handleSwapAction}
            asset={internalSelectedOutputAsset}
            icon={icon}
            iconStyle={confirmButtonIconStyle}
            label={label}
            disabled={disabled}
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
