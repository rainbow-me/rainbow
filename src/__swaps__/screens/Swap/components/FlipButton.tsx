import React, { useCallback, useEffect, useRef } from 'react';
import { InteractionManager, StyleSheet } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { analytics } from '@/analytics';
import { AnimatedBlurView } from '@/components/AnimatedComponents/AnimatedBlurView';
import { AnimatedSpinner } from '@/components/animations/AnimatedSpinner';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { Bleed, Box, IconContainer, Text, globalColors, useColorMode } from '@/design-system';
import { IS_ANDROID, IS_IOS } from '@/env';
import { ChainId } from '@/state/backendNetworks/types';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { SEPARATOR_COLOR } from '@/__swaps__/screens/Swap/constants';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { getColorValueForThemeWorklet, opacity } from '@/__swaps__/utils/swaps';
import { GestureHandlerButton } from './GestureHandlerButton';

export const FlipButton = () => {
  const { isDarkMode } = useColorMode();

  const {
    AnimatedSwapStyles,
    SwapInputController,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    isQuoteStale,
    selectedOutputChainId,
    setAsset,
  } = useSwapContext();

  const chainSetTimeoutId = useRef<NodeJS.Timeout | null>(null);

  const flipWithTracking = useCallback(
    ({
      assetChainId,
      assetToSet,
      assetTypeToSet,
      inputAmount,
      outputChainId,
    }: {
      assetChainId: ChainId | undefined;
      assetToSet: ExtendedAnimatedAssetWithColors | null;
      assetTypeToSet: SwapAssetType;
      inputAmount: string | number;
      outputChainId: ChainId;
    }) => {
      setAsset({ asset: assetToSet, type: assetTypeToSet });

      let shouldUpdateSelectedOutputChainId = false;
      let newInputChainId: ChainId | null = null;
      let previousInputAsset: { address: string; chainId: ChainId; symbol: string } | null = null;
      let previousOutputAsset: { address: string; chainId: ChainId; symbol: string } | null = null;

      useSwapsStore.setState(state => {
        const { outputAsset: newInputAsset, inputAsset: newOutputAsset } = state;

        if (newInputAsset) {
          shouldUpdateSelectedOutputChainId = state.selectedOutputChainId !== newInputAsset.chainId;
          newInputChainId = newInputAsset.chainId;
          previousOutputAsset = { address: newInputAsset.address, chainId: newInputAsset.chainId, symbol: newInputAsset.symbol };
        }
        if (newOutputAsset) {
          previousInputAsset = { address: newOutputAsset.address, chainId: newOutputAsset.chainId, symbol: newOutputAsset.symbol };
        }
        return {
          inputAsset: newInputAsset,
          outputAsset: newOutputAsset,
        };
      });

      const shouldUpdateAnimatedSelectedOutputChainId = outputChainId !== assetChainId;

      if (newInputChainId !== null && (shouldUpdateSelectedOutputChainId || shouldUpdateAnimatedSelectedOutputChainId)) {
        if (chainSetTimeoutId.current) {
          clearTimeout(chainSetTimeoutId.current);
        }

        // This causes a heavy re-render in the output token list, so we delay updating the selected output chain until
        // the animation is most likely complete.
        chainSetTimeoutId.current = setTimeout(() => {
          InteractionManager.runAfterInteractions(() => {
            if (shouldUpdateSelectedOutputChainId) {
              useSwapsStore.setState(state => ({
                selectedOutputChainId: state.inputAsset?.chainId ?? ChainId.mainnet,
              }));
            }
            if (shouldUpdateAnimatedSelectedOutputChainId) {
              selectedOutputChainId.value = newInputChainId ?? ChainId.mainnet;
            }
          });
        }, 750);
      }

      analytics.track(analytics.event.swapsFlippedAssets, { inputAmount, previousInputAsset, previousOutputAsset });
    },
    [selectedOutputChainId, setAsset]
  );

  const handleFlipAssets = useCallback(() => {
    'worklet';
    if (internalSelectedInputAsset.value || internalSelectedOutputAsset.value) {
      isQuoteStale.value = 1;
      const assetTypeToSet = internalSelectedInputAsset.value ? SwapAssetType.outputAsset : SwapAssetType.inputAsset;
      const assetToSet = assetTypeToSet === SwapAssetType.inputAsset ? internalSelectedOutputAsset.value : internalSelectedInputAsset.value;

      runOnJS(flipWithTracking)({
        assetChainId: assetToSet?.chainId,
        assetToSet,
        assetTypeToSet,
        inputAmount: SwapInputController.inputValues.value.inputAmount,
        outputChainId: selectedOutputChainId.value,
      });
    }
  }, [
    SwapInputController.inputValues,
    flipWithTracking,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    isQuoteStale,
    selectedOutputChainId,
  ]);

  const flipButtonInnerStyles = useAnimatedStyle(() => {
    return {
      shadowColor: isDarkMode
        ? globalColors.grey100
        : getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.mixedShadowColor, false),
    };
  });

  useEffect(() => {
    return () => {
      if (chainSetTimeoutId.current) {
        clearTimeout(chainSetTimeoutId.current);
      }
    };
  }, []);

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
        <GestureHandlerButton onPressWorklet={handleFlipAssets} scaleTo={0.8} style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
          <Box alignItems="center" justifyContent="center" style={styles.flipButtonContainer}>
            <AnimatedBlurView
              blurIntensity={10}
              blurStyle={isDarkMode ? 'regular' : 'light'}
              style={[
                AnimatedSwapStyles.flipButtonFetchingStyle,
                styles.flipButton,
                {
                  backgroundColor: IS_ANDROID ? (isDarkMode ? globalColors.blueGrey100 : globalColors.white100) : undefined,
                  borderColor: isDarkMode ? SEPARATOR_COLOR : opacity(globalColors.white100, 0.5),
                },
              ]}
            />
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
        </GestureHandlerButton>
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
      getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.highContrastColor, isDarkMode),
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

const styles = StyleSheet.create({
  flipButton: {
    borderRadius: 15,
    height: 30,
    overflow: 'hidden',
    position: 'absolute',
    width: 30,
  },
  flipButtonContainer: {
    borderRadius: 15,
    height: 30,
    width: 30,
  },
});
