/* eslint-disable no-nested-ternary */
import c from 'chroma-js';
import React, { useCallback } from 'react';
import Animated, { runOnUI, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import SwapSpinner from '@/__swaps__/assets/swapSpinner.png';
import { ButtonPressAnimation } from '@/components/animations';
import { AnimatedSpinner, spinnerExitConfig } from '@/__swaps__/components/animations/AnimatedSpinner';
import { Bleed, Box, IconContainer, Text, globalColors, useColorMode } from '@/design-system';
import { colors } from '@/styles';
import { SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '../constants';
import { opacity } from '../utils/swaps';
import { IS_ANDROID, IS_IOS } from '@/env';
import { AnimatedBlurView } from './AnimatedBlurView';
import { useSwapContext } from '../providers/swap-provider';
import { StyleSheet } from 'react-native';

export const FlipButton = () => {
  const { isDarkMode } = useColorMode();

  const { isFetching, AnimatedSwapStyles, SwapNavigation, SwapInputController, outputProgress } = useSwapContext();

  const fetchingStyle = useAnimatedStyle(() => {
    return {
      borderWidth: isFetching ? withTiming(2, { duration: 300 }) : withTiming(THICK_BORDER_WIDTH, spinnerExitConfig),
    };
  });

  const handleSwapAssets = useCallback(() => {
    runOnUI(() => {
      const prevAssetToSell = SwapInputController.assetToSell.value;
      const prevAssetToBuy = SwapInputController.assetToBuy.value;

      if (prevAssetToBuy) {
        SwapInputController.assetToSell.value = prevAssetToBuy;
      } else {
        SwapInputController.assetToSell.value = null;
      }

      if (prevAssetToSell) {
        SwapInputController.assetToBuy.value = prevAssetToSell;
      } else {
        SwapInputController.assetToBuy.value = null;
      }

      // TODO: if !prevAssetToBuy => focus assetToSell input
      // TODO: if !prevAssetToSell => focus assetToBuy input

      if (outputProgress.value === 1) {
        SwapNavigation.handleOutputPress();
      }
    })();
  }, [SwapInputController.assetToBuy, SwapInputController.assetToSell, SwapNavigation, outputProgress.value]);

  return (
    <Box
      alignItems="center"
      as={Animated.View}
      justifyContent="center"
      style={[AnimatedSwapStyles.flipButtonStyle, AnimatedSwapStyles.focusedSearchStyle, { height: 12, width: 28, zIndex: 10 }]}
    >
      <Box
        as={Animated.View}
        style={{
          shadowColor: isDarkMode ? globalColors.grey100 : c.mix(SwapInputController.bottomColor.value, colors.dark, 0.84).hex(),
          shadowOffset: {
            width: 0,
            height: isDarkMode ? 4 : 4,
          },
          elevation: 8,
          shadowOpacity: isDarkMode ? 0.3 : 0.1,
          shadowRadius: isDarkMode ? 6 : 8,
        }}
      >
        <ButtonPressAnimation onPress={handleSwapAssets} scaleTo={0.8} style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
          {/* TODO: Temp fix - rewrite to actually avoid type errors */}
          {/* @ts-expect-error The conditional as={} is causing type errors */}
          <Box
            alignItems="center"
            as={IS_IOS ? AnimatedBlurView : Animated.View}
            justifyContent="center"
            style={[
              fetchingStyle,
              styles.flipButton,
              {
                backgroundColor: IS_ANDROID ? (isDarkMode ? globalColors.blueGrey100 : globalColors.white100) : undefined,
                borderColor: isDarkMode ? SEPARATOR_COLOR : opacity(globalColors.white100, 0.5),
              },
            ]}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...(IS_IOS && {
              blurAmount: 10,
              blurType: isDarkMode ? undefined : 'light',
            })}
          >
            <IconContainer size={24} opacity={isDarkMode ? 0.6 : 0.8}>
              <Box alignItems="center" justifyContent="center">
                <Bleed bottom={{ custom: IS_IOS ? 0.5 : 4 }}>
                  <Text align="center" color="labelTertiary" size="icon 13px" weight="heavy">
                    􀆈
                  </Text>
                </Bleed>
              </Box>
            </IconContainer>
          </Box>
        </ButtonPressAnimation>
      </Box>
      <Box pointerEvents="none" position="absolute">
        <AnimatedSpinner color={SwapInputController.bottomColor.value} isLoading={isFetching} scaleInFrom={1} size={32} src={SwapSpinner} />
      </Box>
    </Box>
  );
};

export const styles = StyleSheet.create({
  flipButton: {
    borderRadius: 15,
    height: 30,
    width: 30,
  },
});
