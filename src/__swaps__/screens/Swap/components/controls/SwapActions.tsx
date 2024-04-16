import React from 'react';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';

import { Box, Column, Columns, Separator, globalColors, useColorMode } from '@/design-system';
import { safeAreaInsetValues } from '@/utils';

import { SwapActionButton } from '../../components/SwapActionButton';
import { GasButton } from '../../components/GasButton';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '../../constants';
import { IS_ANDROID } from '@/env';
import { useSwapContext, NavigationSteps } from '@/__swaps__/screens/Swap/providers/swap-provider';
import Animated, { runOnUI, useAnimatedStyle } from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { opacity } from '@/__swaps__/utils/swaps';
import { ReviewPanel } from '../ReviewPanel';

export function SwapActions() {
  const { isDarkMode } = useColorMode();
  const {
    confirmButtonIcon,
    confirmButtonIconStyle,
    confirmButtonLabel,
    SwapInputController,
    AnimatedSwapStyles,
    SwapNavigation,
    reviewProgress,
  } = useSwapContext();

  const columnStyles = useAnimatedStyle(() => {
    return {
      display: reviewProgress.value === NavigationSteps.SHOW_REVIEW ? 'none' : 'flex',
    };
  });

  return (
    <Box
      as={Animated.View}
      paddingBottom={{
        custom: IS_ANDROID ? getSoftMenuBarHeight() - 24 : safeAreaInsetValues.bottom + 16,
      }}
      paddingHorizontal="20px"
      style={AnimatedSwapStyles.swapActionWrapperStyle}
      width="full"
      zIndex={11}
    >
      <ReviewPanel />
      <Columns alignVertical="center" space="12px">
        <Column style={columnStyles} width="content">
          <GasButton />
        </Column>
        <Column style={columnStyles} width="content">
          <Box height={{ custom: 32 }}>
            <Separator color={{ custom: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR }} direction="vertical" thickness={1} />
          </Box>
        </Column>
        <SwapActionButton
          onPress={() => runOnUI(SwapNavigation.handleShowReview)()}
          color={SwapInputController.bottomColor}
          icon={confirmButtonIcon}
          iconStyle={confirmButtonIconStyle}
          label={confirmButtonLabel}
          scaleTo={0.9}
        />
      </Columns>
    </Box>
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
});
