/* eslint-disable no-nested-ternary */
import React, { useCallback, useRef } from 'react';
import { InteractionManager, StyleSheet } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { analyticsV2 } from '@/analytics';
import { AnimatedSpinner } from '@/components/animations/AnimatedSpinner';
import { Bleed, Box, IconContainer, Text, globalColors, useColorMode } from '@/design-system';
import { SEPARATOR_COLOR } from '@/__swaps__/screens/Swap/constants';
import { getColorValueForThemeWorklet, opacity } from '@/__swaps__/utils/swaps';
import { IS_ANDROID, IS_IOS } from '@/env';
import { AnimatedBlurView } from '@/__swaps__/screens/Swap/components/AnimatedBlurView';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { GestureHandlerV1Button } from './GestureHandlerV1Button';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { ChainId } from '@/__swaps__/types/chains';

export const FlipButton = () => {
  const { isDarkMode } = useColorMode();

  const {
    AnimatedSwapStyles,
    SwapInputController,
    handleProgressNavigation,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    selectedOutputChainId,
  } = useSwapContext();

  const chainSetTimeoutId = useRef<NodeJS.Timeout | null>(null);

  const flipStoreAssets = useCallback(() => {
    const { inputAsset: newOutputAsset, outputAsset: newInputAsset } = useSwapsStore.getState();

    useSwapsStore.setState({
      inputAsset: newInputAsset,
      outputAsset: newOutputAsset,
    });

    const shouldUpdateSelectedOutputChainId = useSwapsStore.getState().selectedOutputChainId !== newInputAsset?.chainId;
    const shouldUpdateAnimatedSelectedOutputChainId = selectedOutputChainId.value !== internalSelectedInputAsset.value?.chainId;

    if (newInputAsset && (shouldUpdateSelectedOutputChainId || shouldUpdateAnimatedSelectedOutputChainId)) {
      if (chainSetTimeoutId.current) {
        clearTimeout(chainSetTimeoutId.current);
      }

      // This causes a heavy re-render in the output token list, so we delay updating the selected output chain until
      // the animation is most likely complete.
      chainSetTimeoutId.current = setTimeout(() => {
        InteractionManager.runAfterInteractions(() => {
          if (shouldUpdateSelectedOutputChainId) {
            useSwapsStore.setState({
              selectedOutputChainId: newInputAsset?.chainId ?? ChainId.mainnet,
            });
          }
          if (shouldUpdateAnimatedSelectedOutputChainId) {
            selectedOutputChainId.value = newInputAsset?.chainId ?? ChainId.mainnet;
          }
        });
      }, 750);
    }

    analyticsV2.track(analyticsV2.event.swapsFlippedAssets, {
      inputAmount: SwapInputController.inputValues.value.inputAmount,
      previousInputAsset: internalSelectedInputAsset.value,
      previousOutputAsset: internalSelectedOutputAsset.value,
    });
  }, [SwapInputController.inputValues, internalSelectedInputAsset, internalSelectedOutputAsset, selectedOutputChainId]);

  const handleFlipAssets = useCallback(() => {
    'worklet';
    if (internalSelectedInputAsset.value || internalSelectedOutputAsset.value) {
      const assetTypeToSet = internalSelectedInputAsset.value ? SwapAssetType.outputAsset : SwapAssetType.inputAsset;

      // Flip shared value assets and navigate ahead of time because it's faster than waiting for setAsset
      const newOutputAsset = internalSelectedInputAsset.value;
      const newInputAsset = internalSelectedOutputAsset.value;

      internalSelectedInputAsset.value = newInputAsset;
      internalSelectedOutputAsset.value = newOutputAsset;
      handleProgressNavigation({ type: assetTypeToSet });

      runOnJS(flipStoreAssets)();
    }
  }, [flipStoreAssets, handleProgressNavigation, internalSelectedInputAsset, internalSelectedOutputAsset]);

  const flipButtonInnerStyles = useAnimatedStyle(() => {
    return {
      shadowColor: isDarkMode
        ? globalColors.grey100
        : getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.mixedShadowColor, false, true),
    };
  });

  return (
    <Box
      alignItems="center"
      as={Animated.View}
      justifyContent="center"
      style={[AnimatedSwapStyles.flipButtonStyle, AnimatedSwapStyles.focusedSearchStyle, { height: 12, width: 28, zIndex: 10 }]}
    >
      <Box
        as={Animated.View}
        style={[
          flipButtonInnerStyles,
          {
            shadowOffset: {
              width: 0,
              height: isDarkMode ? 4 : 4,
            },
            elevation: 8,
            shadowOpacity: isDarkMode ? 0.3 : 0.1,
            shadowRadius: isDarkMode ? 6 : 8,
          },
        ]}
      >
        <GestureHandlerV1Button onPressWorklet={handleFlipAssets} scaleTo={0.8} style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
          {/* TODO: Temp fix - rewrite to actually avoid type errors */}
          {/* @ts-expect-error The conditional as={} is causing type errors */}
          <Box
            alignItems="center"
            as={IS_IOS ? AnimatedBlurView : Animated.View}
            justifyContent="center"
            style={[
              AnimatedSwapStyles.flipButtonFetchingStyle,
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
        </GestureHandlerV1Button>
      </Box>
      <Box pointerEvents="none" position="absolute">
        <SpinnerComponent />
      </Box>
    </Box>
  );
};

const SpinnerComponent = () => {
  const { isDarkMode } = useColorMode();
  const { isFetching, internalSelectedOutputAsset } = useSwapContext();

  const animatedColor = useDerivedValue(() => {
    return withTiming(
      getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.highContrastColor, isDarkMode, true),
      TIMING_CONFIGS.slowFadeConfig
    );
  });

  return (
    <AnimatedSpinner
      color={animatedColor}
      isLoading={isFetching}
      requireSrc={require('@/assets/swapSpinner.png')}
      scaleInFrom={1}
      size={32}
    />
  );
};

export const styles = StyleSheet.create({
  flipButton: {
    borderRadius: 15,
    height: 30,
    width: 30,
  },
});
