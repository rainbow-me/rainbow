import React, { useCallback } from 'react';
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { AnimatedText, Box, Inline, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { valueBasedDecimalFormatter } from '@/__swaps__/utils/decimalFormatter';
import { opacity } from '@/__swaps__/utils/swaps';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { AddressZero } from '@ethersproject/constants';
import { ETH_ADDRESS } from '@/references';
import { GestureHandlerButton } from './GestureHandlerButton';
import { convertAmountToNativeDisplayWorklet } from '@/helpers/utilities';
import { StyleSheet } from 'react-native';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

export const ExchangeRateBubble = () => {
  const { isDarkMode } = useColorMode();
  const {
    AnimatedSwapStyles,
    SwapInputController: { inputNativePrice, outputNativePrice },
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    isFetching,
  } = useSwapContext();
  const nativeCurrency = userAssetsStoreManager(state => state.currency);

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
      const inputAssetPrice = inputNativePrice.value;
      const outputAssetPrice = outputNativePrice.value;

      if (
        !internalSelectedInputAsset.value ||
        !internalSelectedOutputAsset.value ||
        !inputAssetPrice ||
        !outputAssetPrice ||
        current.inputAssetUniqueId !== previous?.inputAssetUniqueId ||
        current.outputAssetUniqueId !== previous?.outputAssetUniqueId
      ) {
        resetValues();
        return;
      }

      if (current.isFetching && current.rotatingIndex === previous?.rotatingIndex) {
        return;
      }

      const { symbol: inputAssetSymbol, type: inputAssetType } = internalSelectedInputAsset.value;
      const { symbol: outputAssetSymbol, type: outputAssetType } = internalSelectedOutputAsset.value;

      const isInputAssetStablecoin = inputAssetType === 'stablecoin';
      const isOutputAssetStablecoin = outputAssetType === 'stablecoin';

      const inputAssetEthTransform =
        internalSelectedInputAsset.value?.address === ETH_ADDRESS ? AddressZero : internalSelectedInputAsset.value?.address;
      const outputAssetEthTransform =
        internalSelectedOutputAsset.value?.address === ETH_ADDRESS ? AddressZero : internalSelectedOutputAsset.value?.address;

      const isSameAssetOnDifferentChains =
        inputAssetEthTransform === outputAssetEthTransform &&
        internalSelectedInputAsset.value?.chainId !== internalSelectedOutputAsset.value?.chainId;

      if (isSameAssetOnDifferentChains) {
        fromAssetText.value = `1 ${inputAssetSymbol}`;
        toAssetText.value = convertAmountToNativeDisplayWorklet(inputAssetPrice, nativeCurrency);
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
            amount: inputAssetPrice / outputAssetPrice,
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
          toAssetText.value = convertAmountToNativeDisplayWorklet(inputAssetPrice, nativeCurrency);
          break;
        }
        case 3: {
          fromAssetText.value = `1 ${outputAssetSymbol}`;
          toAssetText.value = convertAmountToNativeDisplayWorklet(outputAssetPrice, nativeCurrency);
          break;
        }
      }
    },
    []
  );

  const bubbleVisibilityWrapper = useAnimatedStyle(() => {
    const shouldDisplay = fromAssetText.value.length > 0 && toAssetText.value.length > 0;
    return {
      opacity: shouldDisplay ? withDelay(50, withTiming(1, TIMING_CONFIGS.fadeConfig)) : 0,
    };
  });

  const pointerEventsStyle = useAnimatedStyle(() => {
    const shouldDisplay = fromAssetText.value.length > 0 && toAssetText.value.length > 0;
    return {
      pointerEvents: shouldDisplay ? 'auto' : 'none',
    };
  });

  return (
    <GestureHandlerButton
      hapticTrigger="tap-end"
      hitSlop={{ left: 24, right: 24, top: 12, bottom: 12 }}
      onPressWorklet={onChangeIndex}
      scaleTo={0.9}
      style={pointerEventsStyle}
    >
      <Box as={Animated.View} alignItems="center" justifyContent="center" style={AnimatedSwapStyles.hideWhenInputsExpandedOrPriceImpact}>
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
          testID="swap-exchange-rate-bubble"
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
    </GestureHandlerButton>
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
