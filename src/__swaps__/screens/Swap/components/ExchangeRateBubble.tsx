import React, { useCallback } from 'react';
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AnimatedText, Box, Inline, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH, fadeConfig } from '@/__swaps__/screens/Swap/constants';
import { opacity, valueBasedDecimalFormatter } from '@/__swaps__/utils/swaps';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { AddressZero } from '@ethersproject/constants';
import { ETH_ADDRESS } from '@/references';
import { GestureHandlerV1Button } from './GestureHandlerV1Button';

export const ExchangeRateBubble = () => {
  const { isDarkMode } = useColorMode();
  const { AnimatedSwapStyles, internalSelectedInputAsset, internalSelectedOutputAsset, isFetching } = useSwapContext();

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
  }, [
    internalSelectedInputAsset.value?.address,
    internalSelectedInputAsset.value?.chainId,
    internalSelectedOutputAsset.value?.address,
    internalSelectedOutputAsset.value?.chainId,
    rotatingIndex,
  ]);

  const resetValues = useCallback(() => {
    'worklet';
    fromAssetText.value = '';
    toAssetText.value = '';
  }, [fromAssetText, toAssetText]);

  useAnimatedReaction(
    () => ({
      inputAsset: internalSelectedInputAsset.value,
      outputAsset: internalSelectedOutputAsset.value,
      isFetching,
      rotatingIndex,
    }),
    ({ inputAsset, outputAsset }) => {
      if (!inputAsset || !outputAsset || !inputAsset.nativePrice || !outputAsset.nativePrice) {
        resetValues();
        return;
      }

      const { symbol: inputAssetSymbol, nativePrice: inputAssetPrice, type: inputAssetType } = inputAsset;
      const { symbol: outputAssetSymbol, nativePrice: outputAssetPrice, type: outputAssetType } = outputAsset;

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
        toAssetText.value = `$${inputAssetPrice.toLocaleString('en-US', {
          useGrouping: true,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
        return;
      }

      switch (rotatingIndex.value) {
        case 0: {
          const formattedRate = valueBasedDecimalFormatter(
            inputAssetPrice / outputAssetPrice,
            outputAssetPrice,
            'up',
            -1,
            isOutputAssetStablecoin,
            false
          );
          fromAssetText.value = `1 ${inputAssetSymbol}`;
          toAssetText.value = `${formattedRate} ${outputAssetSymbol}`;
          break;
        }
        case 1: {
          const formattedRate = valueBasedDecimalFormatter(
            outputAssetPrice / inputAssetPrice,
            inputAssetPrice,
            'up',
            -1,
            isInputAssetStablecoin,
            false
          );
          fromAssetText.value = `1 ${outputAssetSymbol}`;
          toAssetText.value = `${formattedRate} ${inputAssetSymbol}`;
          break;
        }
        case 2: {
          fromAssetText.value = `1 ${inputAssetSymbol}`;
          toAssetText.value = `$${inputAssetPrice.toLocaleString('en-US', {
            useGrouping: true,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;
          break;
        }
        case 3: {
          fromAssetText.value = `1 ${outputAssetSymbol}`;
          toAssetText.value = `$${outputAssetPrice.toLocaleString('en-US', {
            useGrouping: true,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;
          break;
        }
      }
    }
  );

  const WrapperStyles = useAnimatedStyle(() => ({
    borderColor: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR,
    borderWidth: THICK_BORDER_WIDTH,
    opacity: withTiming(fromAssetText.value && toAssetText.value ? 1 : 0, fadeConfig),
  }));

  return (
    <GestureHandlerV1Button onPressWorklet={onChangeIndex} scaleTo={0.925}>
      <Box
        as={Animated.View}
        alignItems="center"
        justifyContent="center"
        paddingHorizontal="24px"
        paddingVertical="12px"
        style={[AnimatedSwapStyles.hideWhenInputsExpandedOrPriceImpact, { alignSelf: 'center', position: 'absolute', top: 4 }]}
      >
        <Box
          as={Animated.View}
          alignItems="center"
          borderRadius={15}
          height={{ custom: 30 }}
          justifyContent="center"
          paddingHorizontal="10px"
          style={WrapperStyles}
        >
          <Inline alignHorizontal="center" alignVertical="center" space="6px" wrap={false}>
            <AnimatedText
              align="center"
              color="labelQuaternary"
              size="13pt"
              style={{ opacity: isDarkMode ? 0.6 : 0.75 }}
              weight="heavy"
              text={fromAssetText}
            />
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
            <AnimatedText
              align="center"
              color="labelQuaternary"
              size="13pt"
              style={{ opacity: isDarkMode ? 0.6 : 0.75 }}
              weight="heavy"
              text={toAssetText}
            />
          </Inline>
        </Box>
      </Box>
    </GestureHandlerV1Button>
  );
};
