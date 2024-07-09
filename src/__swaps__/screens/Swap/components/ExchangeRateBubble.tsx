import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { AnimatedText, Box, Inline, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity, valueBasedDecimalFormatter } from '@/__swaps__/utils/swaps';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { IS_IOS } from '@/env';
import { AddressZero } from '@ethersproject/constants';
import { ETH_ADDRESS } from '@/references';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { GestureHandlerV1Button } from './GestureHandlerV1Button';
import { convertAmountToNativeDisplayWorklet } from '@/__swaps__/utils/numbers';
import { useAccountSettings } from '@/hooks';

export const ExchangeRateBubble = () => {
  const { isDarkMode } = useColorMode();
  const { AnimatedSwapStyles, internalSelectedInputAsset, internalSelectedOutputAsset, isFetching } = useSwapContext();
  const { nativeCurrency: currentCurrency } = useAccountSettings();

  const rotatingIndex = useSharedValue(0);
  const fromAssetText = useSharedValue('');
  const toAssetText = useSharedValue('');

  const fillTertiary = useForegroundColor('fillTertiary');

  const onChangeIndex = useCallback(() => {
    'worklet';

    const inputAssetEthTransform =
      internalSelectedInputAsset.value?.address === ETH_ADDRESS ? AddressZero : internalSelectedInputAsset.value?.address;
    const outputAssetEthTransform =
      internalSelectedOutputAsset.value?.address === ETH_ADDRESS ? AddressZero : internalSelectedOutputAsset.value?.address;

    const isSameAssetOnDifferentChains =
      inputAssetEthTransform === outputAssetEthTransform &&
      internalSelectedInputAsset.value?.chainId !== internalSelectedOutputAsset.value?.chainId;

    rotatingIndex.value = isSameAssetOnDifferentChains ? 2 : (rotatingIndex.value + 1) % 4;
  }, [internalSelectedInputAsset, internalSelectedOutputAsset, rotatingIndex]);

  const resetValues = useCallback(() => {
    'worklet';
    fromAssetText.value = '';
    toAssetText.value = '';
  }, [fromAssetText, toAssetText]);

  useAnimatedReaction(
    () => ({
      inputAssetUniqueId: internalSelectedInputAsset.value?.uniqueId,
      isFetching: isFetching.value,
      outputAssetUniqueId: internalSelectedOutputAsset.value?.uniqueId,
      rotatingIndex: rotatingIndex.value,
    }),
    (current, previous) => {
      if (
        !internalSelectedInputAsset.value ||
        !internalSelectedOutputAsset.value ||
        !internalSelectedInputAsset.value.nativePrice ||
        !internalSelectedOutputAsset.value.nativePrice ||
        current.inputAssetUniqueId !== previous?.inputAssetUniqueId ||
        current.outputAssetUniqueId !== previous?.outputAssetUniqueId
      ) {
        resetValues();
        return;
      }

      if (current.isFetching && current.rotatingIndex === previous?.rotatingIndex) {
        return;
      }

      const { symbol: inputAssetSymbol, nativePrice: inputAssetPrice, type: inputAssetType } = internalSelectedInputAsset.value;
      const { symbol: outputAssetSymbol, nativePrice: outputAssetPrice, type: outputAssetType } = internalSelectedOutputAsset.value;

      const isInputAssetStablecoin = inputAssetType === 'stablecoin' ?? false;
      const isOutputAssetStablecoin = outputAssetType === 'stablecoin' ?? false;

      const inputAssetEthTransform =
        internalSelectedInputAsset.value?.address === ETH_ADDRESS ? AddressZero : internalSelectedInputAsset.value?.address;
      const outputAssetEthTransform =
        internalSelectedOutputAsset.value?.address === ETH_ADDRESS ? AddressZero : internalSelectedOutputAsset.value?.address;

      const isSameAssetOnDifferentChains =
        inputAssetEthTransform === outputAssetEthTransform &&
        internalSelectedInputAsset.value?.chainId !== internalSelectedOutputAsset.value?.chainId;

      if (isSameAssetOnDifferentChains) {
        fromAssetText.value = `1 ${inputAssetSymbol}`;
        toAssetText.value = convertAmountToNativeDisplayWorklet(inputAssetPrice, currentCurrency);
        return;
      }

      switch (rotatingIndex.value) {
        case 0: {
          const formattedRate = valueBasedDecimalFormatter({
            amount: inputAssetPrice / outputAssetPrice,
            nativePrice: outputAssetPrice,
            roundingMode: 'up',
            precisionAdjustment: -1,
            isStablecoin: isOutputAssetStablecoin,
            stripSeparators: false,
          });
          fromAssetText.value = `1 ${inputAssetSymbol}`;
          toAssetText.value = `${formattedRate} ${outputAssetSymbol}`;
          break;
        }
        case 1: {
          const formattedRate = valueBasedDecimalFormatter({
            amount: outputAssetPrice / inputAssetPrice,
            nativePrice: inputAssetPrice,
            roundingMode: 'up',
            precisionAdjustment: -1,
            isStablecoin: isInputAssetStablecoin,
            stripSeparators: false,
          });
          fromAssetText.value = `1 ${outputAssetSymbol}`;
          toAssetText.value = `${formattedRate} ${inputAssetSymbol}`;
          break;
        }
        case 2: {
          fromAssetText.value = `1 ${inputAssetSymbol}`;
          toAssetText.value = convertAmountToNativeDisplayWorklet(inputAssetPrice, currentCurrency);
          break;
        }
        case 3: {
          fromAssetText.value = `1 ${outputAssetSymbol}`;
          toAssetText.value = convertAmountToNativeDisplayWorklet(outputAssetPrice, currentCurrency);
          break;
        }
      }
    }
  );

  const bubbleVisibilityWrapper = useAnimatedStyle(() => {
    const shouldDisplay = fromAssetText.value.length > 0 && toAssetText.value.length > 0;
    return {
      opacity: shouldDisplay ? withDelay(50, withTiming(1, TIMING_CONFIGS.fadeConfig)) : 0,
    };
  });

  return (
    <GestureHandlerV1Button
      buttonPressWrapperStyleIOS={IS_IOS ? styles.buttonPosition : undefined}
      onPressWorklet={onChangeIndex}
      scaleTo={0.9}
      style={IS_IOS ? undefined : styles.buttonPosition}
    >
      <Box
        as={Animated.View}
        alignItems="center"
        justifyContent="center"
        style={[AnimatedSwapStyles.hideWhenInputsExpandedOrPriceImpact, styles.buttonPadding]}
      >
        <Box
          alignItems="center"
          as={Animated.View}
          borderRadius={15}
          height={{ custom: 30 }}
          justifyContent="center"
          paddingHorizontal="10px"
          style={[
            bubbleVisibilityWrapper,
            { borderColor: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR, borderWidth: THICK_BORDER_WIDTH },
          ]}
        >
          <Inline alignHorizontal="center" alignVertical="center" space="6px" wrap={false}>
            <AnimatedText align="center" color="labelQuaternary" size="13pt" style={{ opacity: isDarkMode ? 0.6 : 0.75 }} weight="heavy">
              {fromAssetText}
            </AnimatedText>
            <Box
              borderRadius={10}
              height={{ custom: 20 }}
              paddingTop={{ custom: 0.25 }}
              style={{ backgroundColor: opacity(fillTertiary, 0.04) }}
              width={{ custom: 20 }}
            >
              <TextIcon color="labelQuaternary" containerSize={20} opacity={isDarkMode ? 0.6 : 0.75} size="icon 10px" weight="heavy">
                􀄭
              </TextIcon>
            </Box>
            <AnimatedText align="center" color="labelQuaternary" size="13pt" style={{ opacity: isDarkMode ? 0.6 : 0.75 }} weight="heavy">
              {toAssetText}
            </AnimatedText>
          </Inline>
        </Box>
      </Box>
    </GestureHandlerV1Button>
  );
};

const styles = StyleSheet.create({
  buttonPadding: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonPosition: {
    alignSelf: 'center',
    minWidth: DEVICE_WIDTH * 0.6,
    position: 'absolute',
    top: 4,
  },
});
